'use client'
import { Button, Input, Select, SelectItem } from "@nextui-org/react";

let days: string[] = []
let months = ["January" , "February" , "March" , "April" , "May" , "June" , "July" , "August" , "September" , "October" , "November" , "December"]
let years: string[] = []

for (let i = 1; i < 32; i++) {
    days.push(i.toString())
}

for (let i = 1996 ; i < 2025 ; i++) {
    years.push(i.toString())
}

export default function Page() {
    return (
        <div className="m-24 text-3xl text-center">
            <form action={sendPacket}>
                <div className="w-full flex flex-wrap items-center justify-center">
                    If you had invested in 
                    <Input 
                        className="w-32 m-3 text-green-700"
                        type="number" 
                        name="amount"
                    />
                    shares of 
                    <br/>
                    <div className="flex m-3">
                        <div className="my-1">NIFTY 50 on</div>
                        <Select 
                            className="w-16 text-rose-700 ml-6"
                            name="date"
                            placeholder="Date"
                            aria-label="Date"
                        >
                            {days.map((day) => (
                                <SelectItem key={day} value={day}>
                                    {day}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select 
                            className="w-56 text-rose-700"
                            name="month"
                            placeholder="Month"
                            aria-label="Month"
                        >
                            {months.map((month) => (
                                <SelectItem key={month.substring(0,3)} value={(month)}>
                                    {month}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select 
                            className="w-20 text-rose-700"
                            name="year"
                            placeholder="Year"
                            aria-label="Year"
                        >
                            {years.map((year) => (
                                <SelectItem key={year.substring(2)} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </Select>
                        <p className="my-1">, then by today</p>
                    </div>
                    <p className="my-8">
                        you&apos;d have a profit of:&emsp;
                    </p> 
                    <p className="text-green-700" id="profit"></p>
                    <br/>
                </div>
                <Button type="submit">
                        Play
                </Button>
            </form>
        </div>
    )
}

async function sendPacket(formData: FormData) {
    const amount = formData.get('amount')
    const date = formData.get('date') + "-" + formData.get('month') + "-" + formData.get('year')
    
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('amount', amount!.toString());

    const req = await fetch('http://localhost:8000/imf/?' + params)
    const res = await req.json()
    document.getElementById("profit")!.innerText = res.toString()
}