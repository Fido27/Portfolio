'use client'
import { Button, Input, Select, SelectItem } from "@heroui/react";

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
        <div className="m-24 text-3xl">
            <form action={sendPacket}>
                <div className="flex w-full items-center justify-center">
                    If you had invested 
                    <Input 
                        className="w-32 m-3 text-green-700"
                        type="number" 
                        name="amount"
                    />
                </div>
                <div className="my-2 flex w-full items-center justify-center">
                    <div>in NIFTY 50 on</div>
                    <div 
                        className="text-rose-700 ml-6"
                        id="date"
                    ></div>
                    <p>&emsp;then in 1 year </p>
                </div>
                <div className="my-2 flex w-full items-center justify-center">
                    <p> your money would be worth:&emsp;
                    </p> 
                    <p className="text-green-700" id="gains"></p>
                </div>
                <div className="my-2 flex w-full items-center justify-center">
                    <p>
                        which in profit % is:&emsp;
                    </p> 
                    <p className="text-green-700" id="gains_percent"></p>
                    <br/>
                </div>
                <div className="m-5 flex w-full items-center justify-center">
                    <Button type="submit">
                            Play
                    </Button>
                </div>
            </form>
        </div>
    )
}

async function sendPacket(formData: FormData) {
    const amount = formData.get('amount')
    
    const params = new URLSearchParams();
    params.append('amount', amount!.toString());

    const req = await fetch('http://localhost:8000/imf/?' + params)
    const res = JSON.parse(await req.json())
    console.log(res)
    document.getElementById("gains")!.innerText = res.gains
    document.getElementById("gains_percent")!.innerText = res.gains_percent
    document.getElementById("date")!.innerText = res.date
    return false
}