// import { Spotlight } from "../lib/ui/spotlight"
// // import { AILoad, aiload } from "../lib/ui/ai-loading"
// import { Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem } from "@heroui/react";
// import { useState } from "react";

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
'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const API_ENDPOINT = process.env.NEXT_PUBLIC_LINUX_API_URL ?? "/api/v1/explain";

function useExplainCommand() {
	const [commandInput, setCommandInput] = useState("");
	const [aiResponse, setAiResponse] = useState("");
	const [dangerWarning, setDangerWarning] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	const processEvent = useCallback((rawEvent: string) => {
		const lines = rawEvent.split(/\r?\n/).filter((line) => line.trim() !== "");
		if (!lines.length) {
			return false;
		}

		let eventType = "message";
		const dataLines: string[] = [];

		for (const line of lines) {
			if (line.startsWith("event:")) {
				eventType = line.replace("event:", "").trim();
			} else if (line.startsWith("data:")) {
				dataLines.push(line.replace("data:", "").trim());
			}
		}

		const payload = dataLines.join("\n");
		switch (eventType) {
			case "warning":
				if (payload) setDangerWarning(payload);
				break;
			case "message":
				if (payload) setAiResponse((prev) => prev + payload);
				break;
			case "done":
				return true;
			default:
				if (payload) setAiResponse((prev) => prev + payload);
		}
		return false;
	}, []);

	const explain = useCallback(
		async (event?: FormEvent<HTMLFormElement>) => {
			event?.preventDefault();
			if (!commandInput.trim()) {
				setErrorMessage("Please enter a Linux command to explain.");
				return;
			}

			setIsLoading(true);
			setAiResponse("");
			setDangerWarning("");
			setErrorMessage("");
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				const response = await fetch(API_ENDPOINT, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "text/event-stream",
					},
					body: JSON.stringify({ command: commandInput }),
					signal: controller.signal,
				});

				if (!response.ok || !response.body) {
					const errorText = await response.text();
					throw new Error(errorText || "Failed to fetch command explanation.");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				let doneStreaming = false;

				while (!doneStreaming) {
					const { value, done } = await reader.read();
					if (value) {
						buffer += decoder.decode(value, { stream: !done });
					}

					let boundary = buffer.indexOf("\n\n");
					while (boundary !== -1) {
						const rawEvent = buffer.slice(0, boundary);
						buffer = buffer.slice(boundary + 2);
						if (rawEvent.trim() && processEvent(rawEvent)) {
							doneStreaming = true;
							break;
						}
						boundary = buffer.indexOf("\n\n");
					}

					if (done) {
						break;
					}
				}
			} catch (error) {
				if ((error as Error).name === "AbortError") {
					return;
				}
				const message =
					error instanceof Error ? error.message : "Unexpected error while explaining command.";
				setErrorMessage(message);
			} finally {
				setIsLoading(false);
				abortRef.current = null;
			}
		},
		[commandInput, processEvent]
	);

	return {
		commandInput,
		setCommandInput,
		aiResponse,
		dangerWarning,
		errorMessage,
		isLoading,
		explain,
	};
}

export default function page() {
	const {
		commandInput,
		setCommandInput,
		aiResponse,
		dangerWarning,
		errorMessage,
		isLoading,
		explain,
	} = useExplainCommand();

    return (
        <div>
			<div className="h-screen w-full">
				{/* <Spotlight
					className = "-top-60 left-0 md:left-18 md:-top-50"
					fill = "white"
				/> */}

				<div className="m-16">This command was written by "Author"</div>

				<div className="">
						<form className="space-y-2" onSubmit={explain}>
							<label htmlFor="linux-command" className="text-sm font-semibold text-gray-200">
								Command to explain
							</label>
							<input
								id="linux-command"
								type="text"
								value={commandInput}
								onChange={(event) => setCommandInput(event.target.value)}
								placeholder="e.g., cat -n /var/log/syslog"
								className="w-full p-2 border border-gray-300 rounded-md text-white"
							/>
							<div className="flex items-center gap-3">
								<button
									type="submit"
									className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isLoading}
								>
									{isLoading ? "Summoning Linux mentor..." : "Submit"}
								</button>
								{errorMessage && <span className="text-red-400 text-sm">{errorMessage}</span>}
							</div>
						</form>
					</div>

				{/* ### Need to use this later. Main UI!!! */}

				{/* <div className="m-16 grid grid-cols-3 gap-2 text-6xl text-center font-mono font-semibold">
					<div className="row-start-1 col-start-1">
							command
					</div>
					<div className="row-start-2 col-span-full">
							-flags
					</div>
					<div className="row-start-3 col-span-3 justify-self-end">
							[file(s) or params]
					</div>
				</div> */}


                        {/* {AILoad()} */}

				<div className="flex m-24">
					<div id="flagsDesc" className="basis-1/2 ml-8">
						Message here / id=flagsDesc
					</div>
					<div id="llama" className="basis-1/2 ml-8 overflow-y-auto rounded border border-gray-700 p-4 bg-black/40">
						{dangerWarning && (
							<div
								className="mb-4"
								dangerouslySetInnerHTML={{ __html: dangerWarning }}
							/>
						)}
						<div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
							{aiResponse
								|| (isLoading
									? "Generating explanation..."
									: "AI generated explanations will appear here.")}
						</div>
					</div>
				</div>
			</div>
			<div>
				div for the actual man page
			</div>
        </div>
    )
}