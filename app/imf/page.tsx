'use client'

import { useEffect, useState } from 'react';

export default function Page() {
    const [progress, setProgress] = useState(0);
    const [expProgress, setExpProgress] = useState(0);
    const [timeMonths, setTimeMonths] = useState(0); // 0 to 720 months (60 years)
    const [sip, setSIP] = useState(500);
    const [goal, setGoal] = useState(5000000);

    // Constants
    const annualRate = 0.12;
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
    const maxMonths = 1200; // 100 years

    // Calculate accumulated amount for each month
    function calculateAccumulated(months: number, sipAmt: number, rate: number) {
        // Formula for SIP future value: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
        // where P = SIP, r = monthly rate, n = months
        if (rate === 0) return sipAmt * months;
        return sipAmt * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    }

    // Precompute all months' accumulation for slider and progress bars
    const accumulated = Array.from({ length: maxMonths + 1 }, (_, m) => calculateAccumulated(m, sip, monthlyRate));
    const currentAccum = accumulated[timeMonths];
    const goalReachedMonth = accumulated.findIndex(val => val >= goal);
    const cappedGoalMonth = goalReachedMonth === -1 ? maxMonths : goalReachedMonth;

    // Progress calculations
    // Linear: progress towards goal by amount
    const linearProgress = Math.min((currentAccum / goal) * 100, 100);
    // Exponential: progress in terms of time elapsed towards the goal
    // Now: expProgress is simply the percentage of months elapsed out of the months needed to reach the goal
    const expProgressValue = cappedGoalMonth > 0 ? Math.min((timeMonths / cappedGoalMonth) * 100, 100) : 0;

    // Update progress bars
    useEffect(() => {
        setProgress(linearProgress);
        setExpProgress(expProgressValue);
    }, [linearProgress, expProgressValue]);

    // Helper for Indian number formatting
    function formatIndianNumber(num: number) {
        return num.toLocaleString('en-IN');
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black">
            <div className="w-full max-w-2xl flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full flex flex-col items-center mb-10">
                    <label htmlFor="time-slider" className="mb-2 text-2xl font-mono text-white">
                        Time: {Math.floor(timeMonths/12)} years {timeMonths%12} months
                    </label>
                    <input
                        id="time-slider"
                        type="range"
                        min={0}
                        max={maxMonths}
                        value={timeMonths}
                        onChange={e => setTimeMonths(Number(e.target.value))}
                        className="w-full max-w-xl h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between w-full max-w-xl text-base mt-1 text-gray-400">
                        <span>0 months</span>
                        <span>100 years</span>
                    </div>
                    <div className="mt-4 text-lg text-white">
                        Accumulated: <span className="font-mono">₹{currentAccum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
                <div className="w-full flex flex-col items-center space-y-8">
                    <div className="w-full">
                        <div className="mb-2 text-3xl text-white font-bold">Linear</div>
                        <div className="w-full bg-gray-700 rounded-full h-7">
                            <div
                                className={`bg-blue-500 h-7 transition-all duration-100 ${progress === 100 ? 'rounded-full' : 'rounded-l-full'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-base mt-1 text-white font-mono">{progress.toFixed(1)}%</div>
                    </div>
                    <div className="w-full">
                        <div className="mb-2 text-3xl text-white font-bold">Exponential</div>
                        <div className="w-full bg-gray-700 rounded-full h-7">
                            <div
                                className={`bg-green-500 h-7 transition-all duration-100 ${expProgress === 100 ? 'rounded-full' : 'rounded-l-full'}`}
                                style={{ width: `${expProgress}%` }}
                            />
                        </div>
                        <div className="text-base mt-1 text-white font-mono">{expProgress.toFixed(1)}%</div>
                    </div>
                </div>
                <div className="w-full flex flex-col items-center mt-12 space-y-6">
                    <div className="w-full flex flex-col md:flex-row gap-6 justify-center items-center">
                        <div className="flex flex-col w-full md:w-1/2">
                            <label htmlFor="sip-input" className="mb-2 text-lg text-white">SIP</label>
                            <input
                                id="sip-input"
                                type="text"
                                min={0}
                                value={formatIndianNumber(sip)}
                                onChange={e => {
                                    // Remove non-digits and commas, then parse
                                    const raw = e.target.value.replace(/[^\d]/g, '');
                                    setSIP(Number(raw));
                                }}
                                className="w-full border border-gray-600 bg-black text-white rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex flex-col w-full md:w-1/2">
                            <label htmlFor="goal-input" className="mb-2 text-lg text-white">Goal</label>
                            <input
                                id="goal-input"
                                type="text"
                                min={0}
                                value={formatIndianNumber(goal)}
                                onChange={e => {
                                    const raw = e.target.value.replace(/[^\d]/g, '');
                                    setGoal(Number(raw));
                                }}
                                className="w-full border border-gray-600 bg-black text-white rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>
                    <div className="text-lg text-white">Returns <span className="font-bold">12%</span></div>
                </div>
            </div>
        </div>
    );
}