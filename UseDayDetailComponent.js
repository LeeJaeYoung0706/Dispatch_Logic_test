import {Fragment, useEffect, useMemo ,useState} from "react";
import ButtonComponent from "@/components/basic/settings/dispatch/components/small/ButtonComponent";

/**
 * 시간 변환 함수
 * @param selectDeviceUseDay
 * @returns {boolean|{startTime: number, dateList: (string|*[]), endTime: number}}
 */
function timeFunction (selectDeviceUseDay) {
    const splitDateArray = selectDeviceUseDay.view_date.split("~");
    const trimDateArray = splitDateArray.map(value => {
        return value.trim().split(" ");
    })

    if (trimDateArray?.length > 0) {
        let start_date = trimDateArray[0][0];
        let end_date = trimDateArray[1][0];
        let arrayGetStartTime = trimDateArray[0][1];
        let arrayGetEndTime = trimDateArray[1][1];
        const startTime = arrayGetStartTime.split(":")[0];
        const endTime = arrayGetEndTime.split(":")[0];
        const array = getDatesStartToLast(start_date, end_date)
        return {
            dateList: array,
            startTime: Number(startTime),
            endTime: Number(endTime)
        }
    }

    return false;
}

/**
 * 종료일 까지 존재하는 날 계산
 * @param startDate
 * @param lastDate
 * @returns {string|*[]}
 */
function getDatesStartToLast(startDate, lastDate) {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
    if(!(regex.test(startDate) && regex.test(lastDate))) return "Not Date Format";
    const result = [];
    let curDate = new Date(startDate);
    while(curDate <= new Date(lastDate)) {
        result.push(curDate.toISOString().split("T")[0]);
        curDate.setDate(curDate.getDate() + 1);
    }
    return result;
}

const UseDayDetailComponent = ({handleCancel ,handleRegiVariable ,selectDeviceUseDay ,handleSelectDeviceUseDayInList ,handlePopupState}) => {

    const dateTimeList = useMemo( ()=> {
        return timeFunction(selectDeviceUseDay);
    }, [selectDeviceUseDay])

    const initSelectTime = []
    const [selectTime , setSelectTime] = useState(initSelectTime);

    const arrayTime = Array.from(Array(24).keys()).map( value => value < 10 ? "0" + value.toString() : value.toString());

    const handlerDaySelect = (value) => {
        const array = Array.from(Array(24).keys()).map( value => value < 10 ? "0" + value.toString() : value.toString());
        const changeArray = array.map( arrayData => {return {
            date: value,
            idx: arrayData
        }})

        const resultChangeArray = changeArray.filter( dateValue => {
            if (dateTimeList.startTime <= Number(dateValue.idx) && dateTimeList.endTime >= Number(dateValue.idx)) {
                // dateTimeList.endTime
                return dateValue;
            }
        })
        setSelectTime( (values) => {
            const copyArray = [...values];
            const removeDupleArray = copyArray.filter((v, i) => v.date === value);
            if (removeDupleArray.length > 0) {
                if (removeDupleArray.length === 23) {

                }
                const resultArray = copyArray.filter((v, i) =>  v.date !== value);
                return resultArray;
            } else {
                resultChangeArray.map( data => {
                    copyArray.push(data)
                })
                return copyArray
            }
        })
    }

    const handleSelectTime = (data) => {
        setSelectTime( (value) => {
            const copyArray = [...value];
            const removeDupleArray = copyArray.filter((v, i) => JSON.stringify(v) === JSON.stringify(data));
            if (removeDupleArray.length > 0) {
                const resultArray = copyArray.filter((v, i) => JSON.stringify(v) !== JSON.stringify(data));
                return resultArray;
            } else {
                copyArray.push(data);
                return copyArray;
            }
        })
    }

    /**
     * 시간 리스트 선택 펑션
     * @returns {boolean}
     */
    const handleChoiceComple = () => {
        const sort = selectTime.sort( function (a , b) {
            return Number(a.date.replaceAll( "-" , "")) - Number( b.date.replaceAll( "-" , ""))
        });

        const timeValues = sort.reduce((acc, current) => {
            acc[current.date] = acc[current.date] || [];
            acc[current.date].push(current.idx);
            return acc;
        }, {});

        const groups = Object.keys(timeValues).map((key) => {
            return { date: key, selectTime: timeValues[key] };
        });
        const resultArray = []
        groups.map( (values) => {

            const timeSortArray = values.selectTime.sort(function (a , b) {
                return Number(a) - Number(b)
            });
            let tripAllArray = [];
            let tripArray = [];

            for ( let i = 0 ; i < timeSortArray.length; i ++){
                if (i + 1 < timeSortArray.length) {
                    if (Number(timeSortArray[i]) + 1 === Number(timeSortArray[i + 1])) {
                        tripArray.push(timeSortArray[i])
                        tripArray.push(timeSortArray[i + 1])
                        continue;
                    }

                    if (Number(timeSortArray[i]) - 1 === Number(timeSortArray[i - 1])) {
                        tripAllArray.push(tripArray);
                        tripArray = [];
                        continue;
                    }
                } else {
                    if (Number(timeSortArray[i]) - 1 === Number(timeSortArray[i - 1])) {

                        tripAllArray.push(tripArray);
                        tripArray = [];
                        continue;
                    }
                }

                tripAllArray.push([timeSortArray[i]]);
            }
            let stringValue = values.date;
            const setArray = tripAllArray.map( value => {return [...new Set(value)]});
            const resultDate = setArray.map( value =>{
                const sortValue = value.sort( (a , b) => {return a-b})
                if (sortValue.length !== 0){
                    const min = sortValue[0];
                    const max = sortValue[sortValue.length-1];
                    return {
                        start_dt: `${stringValue} ${min}:00:00`,
                        end_dt: `${stringValue} ${max}:59:00`,
                    }
                }
                // 여기 에러 잡기
                throw new Error("test")
            })
            resultArray.push(resultDate);
        })

        if (resultArray.length === 0){
            alert("선택된 예약시간이 없습니다.")
            return false;
        }

        handleRegiVariable("reg_dt")(resultArray)
        handleRegiVariable("device_idx")(Number(selectDeviceUseDay.device_idx))
        $('body').css({overflow:'visible'});
        handlePopupState("useDay")(false)
    }
    return (
        <Fragment>
            <div className="pt-30">
                <h3 className="popup-sub-title">
                    시간 선택
                </h3>
            </div>
            <div className="list-search simple-type">
                <div className="form-group-wrap popup-group-type2">
                    <div className="form-search-inputs popup-pfl popup-mr-type1">
                        <div className="form-group is-row">
                            <div className="form-item-wrap is-row w-270">
                                <div className="form-label">
                                    <label htmlFor="p_sip3">차량번호</label>
                                </div>
                                <div className="form-item">
                                    <input type="text" className="form-control " id="p_sip3"
                                           value={selectDeviceUseDay.plate_no}
                                           readOnly={true}
                                    />
                                </div>
                            </div>
                            <div className="form-item-wrap is-row w-270">
                                <div className="form-label">
                                    <label htmlFor="p_sip3">차량명</label>
                                </div>
                                <div className="form-item">
                                    <input type="text" className="form-control" id="p_sip3"
                                           value={selectDeviceUseDay.car_name}
                                           readOnly={true}/>
                                </div>
                            </div>
                        </div>
                        <div className="form-group is-row mt-10">
                            <div className="form-item-wrap is-row w-270">
                                <div className="form-label popup-pr-13">
                                    <label htmlFor="p_sip4">사용일</label>
                                </div>
                                <div className="form-item">
                                    <p className="popup-ph-30">{selectDeviceUseDay.view_date != null && selectDeviceUseDay.view_date}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className="pt-30 popup-allioc">
                <div className="fl">
                    <h3 className="popup-sub-small-title">
                        예약현황
                    </h3>
                </div>
                <div className="fr">
                    {/*<div className="ico1 fl mr-5"></div>*/}
                    {/*<div className="all-txt fl pr-10">선택 불가</div>*/}
                    <div className="ico2 fl mr-5"></div>
                    <div className="all-txt fl">현재선택</div>
                </div>
            </div>
            <div className="list-area popup-pt-21">
                <div className="list-area__body">
                    <div className="card list-card no-outlined pb-0">
                        <div className="list-card__body">
                            <table className="table table-list-pop thead-gray-lighter popup-tb-list">
                                <caption>예약현황</caption>
                                <colgroup>
                                    <col width="18"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                    <col width="6"/>
                                </colgroup>
                                <thead>
                                <tr>
                                    <th scope="col">일자/시간</th>
                                    <th scope="col">00</th>
                                    <th scope="col">01</th>
                                    <th scope="col">02</th>
                                    <th scope="col">03</th>
                                    <th scope="col">04</th>
                                    <th scope="col">05</th>
                                    <th scope="col">06</th>
                                    <th scope="col">07</th>
                                    <th scope="col">08</th>
                                    <th scope="col">09</th>
                                    <th scope="col">10</th>
                                    <th scope="col">11</th>
                                    <th scope="col">12</th>
                                    <th scope="col">13</th>
                                    <th scope="col">14</th>
                                    <th scope="col">15</th>
                                    <th scope="col">16</th>
                                    <th scope="col">17</th>
                                    <th scope="col">18</th>
                                    <th scope="col">19</th>
                                    <th scope="col">20</th>
                                    <th scope="col">21</th>
                                    <th scope="col">22</th>
                                    <th scope="col">23</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    dateTimeList.dateList?.length !== 0 ? dateTimeList.dateList?.map(value => {
                                        return (
                                            <tr className="datev" key={value}>
                                                <td>
                                                    <div className="cell" onClick={() => {handlerDaySelect(value)}}>
                                                        {value}
                                                    </div>
                                                </td>
                                                {
                                                    arrayTime.map( (dataNumber , i1) => {
                                                        return (
                                                            <td
                                                                key={dataNumber}
                                                                className={dateTimeList.startTime > dataNumber ? "disabled-time-list" : dateTimeList.endTime < dataNumber ? "disabled-time-list" : selectTime.filter( (values) => JSON.stringify(values) === JSON.stringify({date: value , idx: dataNumber})).length > 0 ? "chk-blue": "" }
                                                                onClick={() =>{
                                                                    if (dateTimeList.startTime > dataNumber || dateTimeList.endTime < dataNumber ) {
                                                                        return false;
                                                                    }
                                                                    handleSelectTime({date: value , idx: dataNumber})
                                                                }}
                                                            >{dataNumber}</td>
                                                        )
                                                    })
                                                }
                                            </tr>
                                        )

                                    }) :
                                        <tr className="datev">
                                        </tr>
                                }


                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="list-btns mt-25 popup-pfr pb-10">
                        <ButtonComponent
                            handler={() => {handleCancel()}}
                            i18nKey={"cancel"}
                            className={"btn btn-outline-gray-gray popup-w-74"}
                        />
                        <ButtonComponent
                            styleOption={{marginLeft: "10px"}}
                            handler={() => {handleChoiceComple()}}
                            i18nKey={"success"}
                            className={"btn btn-fill-primary-white popup-w-74"}
                        />
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default UseDayDetailComponent;
