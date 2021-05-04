import React, {useCallback, useEffect, useReducer, useRef, useState} from "react";
import "./mine_sweeper.css"
import clock from "./stopwatch.png"
import flag from "./flag.png"
import Button from "react-bootstrap/Button"
import Col from "react-bootstrap/Col"
import Container from "react-bootstrap/Container"
import Dropdown from "react-bootstrap/Dropdown"
import Row from "react-bootstrap/Row"
import {SelectCallback} from "react-bootstrap/helpers";
import {MineSweeperGame} from "./MiseSweeperGame";

type MinePlayState = "won" | "playing" | "lost";
type DifficultyStr = "easy" | "medium" | "hard";
const EASY_STR: DifficultyStr = "easy";
const MEDIUM_STR: DifficultyStr = "medium";
const HARD_STR: DifficultyStr = "hard";

export interface DifficultySettings {
    flags: number;
    cols: number;
    rows: number;
    str: DifficultyStr;
}

const difficultyToSettings = {
    easy: {flags: 10, cols: 10, rows: 8, str: EASY_STR},
    medium: {flags: 40, cols: 18, rows: 14, str: MEDIUM_STR},
    hard: {flags: 99, cols: 24, rows: 20, str: HARD_STR},
}

interface NextOrSet {
    mode: "increment" | "reset";
    value: number;
}

function incrementOrSet(state: number, next: NextOrSet) {
    if (next.mode === "increment") {
        return state + next.value;
    } else {
        return next.value
    }
}

function getBestTimeKey(difficulty: DifficultySettings) {
    return `${difficulty.str}_high_score`;
}

function MineSweeperMainBar({setDifficulty, difficulty, time, numFlags}: { setDifficulty: SelectCallback, difficulty: DifficultySettings, time: number, numFlags: number }) {
    return <Container fluid className={"mine-bar"}>
        <Row>
            <Col>
                <Dropdown onSelect={setDifficulty} className="bar-dropdown">
                    <Dropdown.Toggle className="bar-dropdown-toggle" variant="success">
                        {difficulty.str}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item eventKey={EASY_STR} active={difficulty.str === EASY_STR} className="bar-dropdown-item">
                            easy
                        </Dropdown.Item>
                        <Dropdown.Item eventKey={MEDIUM_STR} active={difficulty.str === MEDIUM_STR} className="bar-dropdown-item">
                            medium
                        </Dropdown.Item>
                        <Dropdown.Item eventKey={HARD_STR} active={difficulty.str === HARD_STR} className="bar-dropdown-item">
                            hard
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Col>
            <Col>
                <img className="bar-image" src={clock} alt="time"/>
                {time}
            </Col>
            <Col>
                <img className="bar-image" src={flag} alt="flag"/>
                {numFlags}
            </Col>
        </Row>
    </Container>
}

function WinLossScreen({time, difficulty, onContinue, message}: { time: number | null, difficulty: DifficultySettings, onContinue: () => void, message: string }) {

    const timeDisplayed = time === null ? "---" : time.toString();
    const bestTime = localStorage.getItem(getBestTimeKey(difficulty));
    const bestTimeDisplayed = bestTime === null ? "---" : bestTime;

    return <Container fluid className="win-loss-screen">
        <Row>
            <Col>
                {message}
            </Col>
        </Row>
        <Row>
            <Col>
                <div className="winloss-best-time-label">Time:</div>
                <div className="winloss-best-time">{timeDisplayed}</div>
            </Col>
            <Col>
                <div className="winloss-best-time-label">Best Time:</div>
                <div className="winloss-best-time">{bestTimeDisplayed}</div>
            </Col>
        </Row>
        <Row>
            <Col className="button-extra-margin">
                <Button onClick={onContinue}>Continue...</Button>
            </Col>
        </Row>
    </Container>
}


export function MineSweeper() {
    const [difficulty, setDifficulty] = useReducer((state: DifficultySettings, next: DifficultyStr) => difficultyToSettings[next], difficultyToSettings.easy);
    const [timer, incrementOrSetTimerBy] = useReducer((state: number, next: NextOrSet = {mode: "increment", value: 1}) => incrementOrSet(state, next), 0);

    const [numFlagsRemaining, decrementOrSetNumFlagsBy] = useReducer((state: number, next: NextOrSet = {
        mode: "increment",
        value: -1
    }) => incrementOrSet(state, next), difficulty.flags);
    // @ts-ignore
    const incrementNumFlags = useCallback(() => decrementOrSetNumFlagsBy({mode: "increment", value: 1}), [decrementOrSetNumFlagsBy])

    const [playState, setPlayState] = useState<MinePlayState>("playing");

    const localsRef = useRef({timer, difficulty});

    const onWin = useCallback(() => {
        const {timer, difficulty} = localsRef.current;
        const bestTimeKey = getBestTimeKey(difficulty);
        const bestTime = localStorage.getItem(bestTimeKey);
        if (bestTime === null || timer < parseInt(bestTime)) {
            localStorage.setItem(bestTimeKey, timer.toString());
        }
        setPlayState("won")
    }, [setPlayState, localsRef])

    const onLoss = useCallback(() => setPlayState("lost"), [setPlayState])

    //when difficulty changes, reset timer back to 0 and set num flags remaining
    useEffect(() => {
        let interval: any = null;
        if (playState === "playing") {
            interval = setInterval(incrementOrSetTimerBy, 1000);
            //useReducer currently bugged so thinks default parameters make it so no parameters can happen.
            // ommiting typescript ignores will make it so it thinks it has too many arguments, expected 0
            // @ts-ignore
            incrementOrSetTimerBy({mode: "reset", value: 0});
            // @ts-ignore
            decrementOrSetNumFlagsBy({mode: "reset", value: difficulty.flags});
        }
        return () => {
            if (interval !== null) {
                clearInterval(interval)
            }
        }
    }, [difficulty, incrementOrSetTimerBy, playState])


    let content;
    if (playState === "playing") {
        content = <>
            <MineSweeperMainBar difficulty={difficulty} setDifficulty={setDifficulty as SelectCallback} numFlags={numFlagsRemaining} time={timer}/>
            <MineSweeperGame difficulty={difficulty} decrementNumFlags={decrementOrSetNumFlagsBy} incrementNumFlags={incrementNumFlags} onLoss={onLoss} onWin={onWin}/>
        </>
    } else {
        const timeOrNull = playState === "won" ? timer : null;
        const message = playState === "won" ? "You Won!" : "Better Luck Next Time";
        content = <WinLossScreen time={timeOrNull} difficulty={difficulty} message={message} onContinue={() => setPlayState("playing")}/>
    }
    localsRef.current = {timer, difficulty}
    return <div className={"minesweeper-div"}>
        {content}
    </div>
}