'use client'
import { Spotlight } from "../ui/spotlight"
import { AILoad, aiload } from "../ui/ai-loading";
import { Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { useState } from "react";
import cat from "./sample.json"

// TODO: maybe try async await for both boxes to improve load times, nvm lol
// TODO: have the ai box load on button to consume less resources
async function flagsDesc(keys : Set<string>) {
	const desc = document.getElementById("flagsDesc")
	const ai = document.getElementById("llama")
    desc!.innerHTML = `<div className="font-bold underline">Descriptions of you chosen flags</div>`
    ai!.innerHTML = `<div className="font-bold underline">AI descriptions of your chosen flags</div><l-quantum size="100" speed="2.75" color="white"/>`
	let keyString = ""

	// Desc logic
    keys.forEach(key => {
		keyString += key
        cat.flags.forEach(flag => {
            if (flag.id === key) {
                const content = `<div className="ml-2">-${key}: ${flag.desc}</div>`
                desc!.innerHTML += content
            }
        })
    })

	// Llama logic
	const req = await fetch('http://localhost:8000/linuxmancyclopedia/llama/' + cat.cmd + '/' + keyString)
    const res = await req.json()
    ai!.innerText = res
}

function flags(items:{id:string, desc:string}[]) {
	const [SelectedKeys, setSelectedKeys] = useState(new Set());

	// const selection = (key : any) => {
	// 	console.log("Most recently selected or deselected key:", key);
	// };

	const flagHolder = () => {
		const placeholder = new Set()
		items.map(item => (placeholder.add(item.id)))
		if (SelectedKeys.size === 0) {
			return (
				<Button className="font-semibold">
					[-{placeholder}]
				</Button>
			)
		} else {
			return (
				<Button className="font-semibold">
					-{SelectedKeys}
				</Button>
			)
		}
	}
	
	const handleSelectionChange = (currentSelectedKeys: Set<string>) => {
		const allKeys = new Set([...SelectedKeys, ...currentSelectedKeys]);
		let changedKey = null;
		allKeys.forEach(key => {
			if (!SelectedKeys.has(key) || !currentSelectedKeys.has(key)) {
				changedKey = key;  // This is the key that was either added or removed
			}
		});
		console.log(currentSelectedKeys)
		setSelectedKeys(currentSelectedKeys)  // Update the state with the new set of keys
		// if (changedKey !== null) {
		// 	selection(changedKey);  // Call the selection function with the changed key
		// }
		flagsDesc(currentSelectedKeys) // To update the flagsDesc box
	}

    return (
		<Dropdown>
			<DropdownTrigger>
				{flagHolder()}
			</DropdownTrigger>
			<DropdownMenu 
				aria-label="Multiple selection of cmd flags"
				variant="flat"
				closeOnSelect={false}
				disallowEmptySelection={false}
				selectionMode="multiple"
				selectedKeys={SelectedKeys}
				onSelectionChange={handleSelectionChange}
			>
				{items.map(item => (
					<DropdownItem
						key={item.id}
						description={item.desc}	
						textValue={item.id}
					>
						<span className="text-2xl">
							{item.id}
						</span>
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
    );
}

export default function page() {
    return (
        <div>
			<div className="h-screen w-full">
				<Spotlight
					className = "-top-60 left-0 md:left-18 md:-top-50"
					fill = "white"
				/>

				<div className="m-16">This command was written by {cat.author}</div>

				<div className="m-16 grid grid-cols-3 gap-2 text-6xl text-center font-mono font-semibold">
					<div className="row-start-1 col-start-1">
							{cat.cmd}
					</div>
					<div className="row-start-2 col-span-full">
							{flags(cat.flags)}
					</div>
					<div className="row-start-3 col-span-3 justify-self-end">
							[file(s)]
					</div>
				</div>

				<div className="flex m-24">
					<div id="flagsDesc" className="basis-1/2 ml-8">
						Message here / id=flagsDesc
					</div>
					<div id="llama" className="basis-1/2 ml-8">
						AI generated here / id=llama
						{AILoad()}
					</div>
				</div>
			</div>
			<div>
				div for the actual man page
			</div>
        </div>
    )
}