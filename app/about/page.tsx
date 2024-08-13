// 'use client'
import Image from "next/image"

export default function page() {
    return (
        <div className="flex h-screen items-center mx-8">
            <div className="grid w-1/2 justify-items-center">
                <Image
                    src = "/pic.jpg"
                    alt = "My photo ig"
                    width = "200"
                    height = "250"
                />

                <p className = "p-8 text-center text-6xl font-bold">
                    Aarav Jain
                </p>

                {/* <p className = "py-3 text-3xl font-thin ">
                    Software Developer
                    </p> */}
                
                <ul className = "flex">
                    <li>
                        <a href = "https://github.com/Fido27" target = "_blank">
                        <Image
                            src = "/icons/github cartoon.svg"
                            alt = "Github Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                        </a>
                    </li>
                    <li>
                        <a href = "mailto:aaravjain272003@gmail.com" target = "_blank">
                        <Image
                            src = "/icons/gmail cartoon.svg"
                            alt = "Email Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                        </a>
                    </li>
                    <li>
                        <a href = "http://discordapp.com/users/361380275533512724" target = "_blank">
                        <Image
                            src = "/icons/discord cartoon.svg"
                            alt = "Discord Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                        </a>
                    </li>
                    <li>
                        <a href = "https://www.instagram.com/____fido/" target = "_blank">
                        <Image
                            src = "/icons/instagram purple.svg"
                            alt = "Instagram Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                        </a>
                    </li>
                    <li>
                        <a href = "https://www.linkedin.com/in/aaravjain272003/" target = "_blank">
                        <Image
                            src = "/icons/linkedin blue outline.svg"
                            alt = "LinkedIn Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    )
}