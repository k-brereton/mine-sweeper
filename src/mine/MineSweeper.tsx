import React, {useCallback, useEffect, useReducer, useRef, useState} from "react";
import "./mine_sweeper.css"

import {Button, Col, Container, Dropdown, Row} from "react-bootstrap"
import {SelectCallback} from "react-bootstrap/helpers";
import {MineSweeperGame} from "./MiseSweeperGame";

type MinePlayState="won"|"playing"|"lost";
type DifficultyStr="easy"|"medium"|"hard";
const EASY_STR:DifficultyStr="easy";
const MEDIUM_STR:DifficultyStr="medium";
const HARD_STR:DifficultyStr="hard";
export interface DifficultySettings{
    flags:number;
    cols:number;
    rows:number;
    str:DifficultyStr;
}

const difficultyToSettings={
    easy:{flags:10,cols:10,rows:8,str:EASY_STR},
    medium:{flags:40,cols:18,rows:14,str:MEDIUM_STR},
    hard:{flags:99,cols:24,rows:20,str:HARD_STR},
}

interface NextOrSet{
    mode:"increment"|"reset";
    value:number;
}
function incrementOrSet(state:number,next:NextOrSet){
    if(next.mode === "increment") {
        return state + next.value;
    }
    else{
        return next.value
    }
}

function getBestTimeKey(difficulty:DifficultySettings){
    return `${difficulty.str}_high_score`
}

function MineSweeperMainBar({setDifficulty, difficulty, time, numFlags}:{setDifficulty:SelectCallback,difficulty:DifficultySettings,time:number, numFlags:number}){
    return<Container fluid>
        <Row>
            <Col>
                <Dropdown onSelect={setDifficulty}>
                <Dropdown.Toggle>
                    {difficulty.str}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey={EASY_STR} active={difficulty.str === EASY_STR}>
                        easy
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={MEDIUM_STR} active={difficulty.str === MEDIUM_STR}>
                        medium
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={HARD_STR} active={difficulty.str === HARD_STR}>
                        hard
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            </Col>
            <Col>
                {time}
            </Col>
            <Col>
                {numFlags}
            </Col>
        </Row>
    </Container>
}

function WinLossScreen({time,difficulty,onContinue, message}:{time:number|null,difficulty:DifficultySettings,onContinue:()=>void,message:string}){

    const timeDisplayed=time===null? "---":time.toString();
    const bestTime=localStorage.getItem(getBestTimeKey(difficulty));
    const bestTimeDisplayed=bestTime===null? "---":bestTime;

    return<Container fluid>
        <Row>
            {message}
        </Row>
        <Row>
            <Col>
                {timeDisplayed}
                best time:{bestTimeDisplayed}
            </Col>
        </Row>
        <Row>
            <Button onClick={onContinue}>Continue...</Button>
        </Row>
    </Container>
}



//todo remove eslint settings.
export function MineSweeper() {
    const [difficulty,setDifficulty]=useReducer((state:DifficultySettings,next:DifficultyStr)=>difficultyToSettings[next],difficultyToSettings.easy);
    const [timer,incrementOrSetTimerBy]=useReducer((state:number, next:NextOrSet={mode:"increment",value:1})=>incrementOrSet(state,next),0);

    const [numFlagsRemaining,decrementOrSetNumFlagsBy]=useReducer((state:number, next:NextOrSet={mode:"increment",value:-1})=>incrementOrSet(state,next),difficulty.flags);
    // @ts-ignore
    const incrementNumFlags=useCallback(()=>decrementOrSetNumFlagsBy({mode:"increment",value:1}),[decrementOrSetNumFlagsBy])

    const [playState,setPlayState]=useState<MinePlayState>("playing");

   const localsRef= useRef({timer,difficulty});

    const onWin=useCallback(()=>{
        const {timer,difficulty}= localsRef.current;
        const bestTimeKey=getBestTimeKey(difficulty);
        const bestTime=localStorage.getItem(bestTimeKey);
        if(bestTime === null || timer < parseInt(bestTime) ){
            localStorage.setItem(bestTimeKey,timer.toString());
        }
        setPlayState("won")
    },[setPlayState,localsRef])

    const onLoss=useCallback(()=>setPlayState("lost"),[setPlayState])

    //when difficulty changes, reset timer back to 0 and set num flags remaining
    useEffect(()=>{
        let interval:any = null;
        if(playState === "playing"){
            interval=setInterval(incrementOrSetTimerBy,1000);
            //useReducer currently bugged so thinks default parameters make it so no parameters can happen.
            // ommiting typescript ignores will make it so it thinks it has too many arguments, expected 0
            // @ts-ignore
            incrementOrSetTimerBy({mode:"reset",value:0});
            // @ts-ignore
            decrementOrSetNumFlagsBy({mode:"reset",value:difficulty.flags});
        }
        return ()=>{
            if (interval!==null){
                clearInterval(interval)
            }
        }
    },[difficulty,incrementOrSetTimerBy,playState])



    let content;
    if (playState === "playing"){
        const canPlaceFlags=numFlagsRemaining!==0;

        content=<>
            <MineSweeperMainBar difficulty={difficulty} setDifficulty={setDifficulty as SelectCallback} numFlags={numFlagsRemaining} time={timer}/>
            <MineSweeperGame difficulty={difficulty} canPlaceFlags={canPlaceFlags} decrementNumFlags={decrementOrSetNumFlagsBy} incrementNumFlags={incrementNumFlags} onLoss={onLoss} onWin={onWin}/>
        </>
    }
    else{
        const timeOrNull= playState === "won" ? timer:null;
        const message= playState === "won" ? "you won!":"better luck next time bud";
        content=<WinLossScreen time={timeOrNull} difficulty={difficulty} message={message} onContinue={()=>setPlayState("playing")}/>
    }
    localsRef.current={timer,difficulty}
    return<div className={"minesweeper-div"}>
        {content}
    </div>
}