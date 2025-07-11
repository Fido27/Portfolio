// 'use client'
// import { Spotlight } from "../lib/ui/spotlight"
// // import { AILoad, aiload } from "../lib/ui/ai-loading"
// import { Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem } from "@heroui/react";
// import { useState } from "react";
// import cat from "./sample.json"

// // TODO: maybe try async await for both boxes to improve load times, nvm lol
// // TODO: have the ai box load on button to consume less resources
// async function flagsDesc(keys : Set<string>) {
// 	const desc = document.getElementById("flagsDesc")
// 	const ai = document.getElementById("llama")
//     desc!.innerHTML = `<div className="font-bold underline">Descriptions of you chosen flags</div>`
//     ai!.innerHTML = `<div className="font-bold underline">AI descriptions of your chosen flags</div><l-quantum size="100" speed="2.75" color="white"/>`
// 	let keyString = ""

// 	// Desc logic
//     keys.forEach(key => {
// 		keyString += key
//         cat.flags.forEach(flag => {
//             if (flag.id === key) {
//                 const content = `<div className="ml-2">-${key}: ${flag.desc}</div>`
//                 desc!.innerHTML += content
//             }
//         })
//     })

// 	// Llama logic
// 	const req = await fetch('http://localhost:8000/linuxmancyclopedia/llama/' + cat.cmd + '/' + keyString)
//     const res = await req.json()
//     ai!.innerText = res
// }

// function flags(items:{id:string, desc:string}[]) {
// 	const [SelectedKeys, setSelectedKeys] = useState(new Set());

// 	// const selection = (key : any) => {
// 	// 	console.log("Most recently selected or deselected key:", key);
// 	// };

// 	const flagHolder = () => {
// 		const placeholder = new Set()
// 		items.map(item => (placeholder.add(item.id)))
// 		if (SelectedKeys.size === 0) {
// 			return (
// 				<Button className="font-semibold">
// 					[-{placeholder}]
// 				</Button>
// 			)
// 		} else {
// 			return (
// 				<Button className="font-semibold">
// 					-{SelectedKeys}
// 				</Button>
// 			)
// 		}
// 	}
	
// 	const handleSelectionChange = (currentSelectedKeys: Set<string>) => {
// 		const allKeys = new Set([...SelectedKeys, ...currentSelectedKeys]);
// 		let changedKey = null;
// 		allKeys.forEach(key => {
// 			if (!SelectedKeys.has(key) || !currentSelectedKeys.has(key)) {
// 				changedKey = key;  // This is the key that was either added or removed
// 			}
// 		});
// 		console.log(currentSelectedKeys)
// 		setSelectedKeys(currentSelectedKeys)  // Update the state with the new set of keys
// 		// if (changedKey !== null) {
// 		// 	selection(changedKey);  // Call the selection function with the changed key
// 		// }
// 		flagsDesc(currentSelectedKeys) // To update the flagsDesc box
// 	}

//     return (
// 		<Dropdown>
// 			<DropdownTrigger>
// 				{flagHolder()}
// 			</DropdownTrigger>
// 			<DropdownMenu 
// 				aria-label="Multiple selection of cmd flags"
// 				variant="flat"
// 				closeOnSelect={false}
// 				disallowEmptySelection={false}
// 				selectionMode="multiple"
// 				selectedKeys={SelectedKeys}
// 				onSelectionChange={handleSelectionChange}
// 			>
// 				{items.map(item => (
// 					<DropdownItem
// 						key={item.id}
// 						description={item.desc}	
// 						textValue={item.id}
// 					>
// 						<span className="text-2xl">
// 							{item.id}
// 						</span>
// 					</DropdownItem>
// 				))}
// 			</DropdownMenu>
// 		</Dropdown>
//     );
// }

export default function page() {
    return (<></>
//         <div>
// 			<div className="h-screen w-full">
// 				<Spotlight
// 					className = "-top-60 left-0 md:left-18 md:-top-50"
// 					fill = "white"
// 				/>

// 				<div className="m-16">This command was written by {cat.author}</div>

// 				<div className="m-16 grid grid-cols-3 gap-2 text-6xl text-center font-mono font-semibold">
// 					<div className="row-start-1 col-start-1">
// 							{cat.cmd}
// 					</div>
// 					<div className="row-start-2 col-span-full">
// 							{flags(cat.flags)}
// 					</div>
// 					<div className="row-start-3 col-span-3 justify-self-end">
// 							[file(s)]
// 					</div>
// 				</div>

// 				<div className="flex m-24">
// 					<div id="flagsDesc" className="basis-1/2 ml-8">
// 						Message here / id=flagsDesc
// 					</div>
// 					<div id="llama" className="basis-1/2 ml-8 overflow-scroll overflow-clip ">
// 						AI generated here / id=llama
// 						The `cat` command is a fundamental tool in Linux for concatenating and manipulating text files. The `-n` option specifies that the command should number its output.

// When you run the command `cat -n`, it reads the contents of one or more files (or standard input if no files are specified) and prints them to the console, with each line numbered starting from 1.

// Here's a breakdown of what this command does:

// * `cat`: This is the command name, which stands for "concatenate" or "copy and tack". It's used to display the contents of one or more files.
// * `-n`: This option tells `cat` to number its output. Each line will be prefixed with a sequential number, starting from 1.

// When you run this command, it will:

// 1. Read the contents of each file specified (or standard input if no files are specified).
// 2. Print each line of the file(s) to the console.
// 3. Prefix each line with a sequential number, starting from 1.

// This can be useful for quickly reviewing the contents of a text file or for generating a numbered list of lines in a file. For example, you might use this command to review the output of another command or to generate a list of lines in a log file.

// Keep in mind that `cat` is not limited to just printing files; it can also be used to redirect the output of other commands to a new file. For example, you could use `grep -n pattern file.txt` to search for a specific pattern in a file and number the matching lines.
// 						{AILoad()}
// 					</div>
// 				</div>
// 			</div>
// 			<div>
// 				div for the actual man page
// 			</div>
//         </div>
    )
}