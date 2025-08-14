import Image from "next/image"

export default function Blogs() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-fixed bg-center bg-cover bg-[url('/Background/black_sand_waves.jpg')] before:content-[''] before:absolute before:inset-0 before:backdrop-blur-sm before:bg-black/40"></div>
            <div className="relative z-10 px-6 py-12 md:px-32 md:py-20">
			<div id="blogPageStart" className="h-full">
				<div id="blogTitle" className="p-6 my-6 md:my-10 text-4xl md:text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
                    Creative Tambola Ticket Generator
                </div>
            </div>
            <div id="blogByLine" className="text-base md:text-lg text-center italic mt-3 mb-6">
                <pre>                  <span className="text-transparent bg-clip-text bg-gradient-to-r to-sky-500 from-emerald-500">- Aarav Jain</span></pre>
            </div>
            
            <div className="my-4 py-2 text-base md:text-[27px]/[1.7]">
                <div className="pt-4">
                    Imagine you&rsquo;re hosting an event with 200 people in your locality and you make room for some tambola over chai, something loved by all age groups. You don&rsquo;t want it to be boring of course, there are 200 people you have to entertain after all and most of them have played the boring old game before. Lets spice it up. Theme it up. Give it some personality. 
                </div>
				<div className="text-3xl md:text-6xl my-8 md:my-12 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
                    How My Model Works (Simple Explanation!)
                </div>
                <div>
                    Download the files from <a className="text-blue-800 underline" href="https://github.com/Fido27/TambolaBingoTicketGenerator">here</a>. This program has 3 files - <span className="text-transparent bg-clip-text bg-gradient-to-r to-teal-400 from-cyan-600">font.ttf,</span> <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">sample.png,</span> <span className="text-transparent bg-clip-text bg-gradient-to-r to-violet-600 from-sky-500">script.py</span>. I will go through this program to ensure that you are able to ease in with these simple steps.

                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-teal-400 from-cyan-600">font.ttf</span>
                    </div>
                    If you want a different font, replace the font.ttf with any font you like. You can download a ttf file from websites like <a className="" href="https://fonts.google.com">Google Fonts</a>. Just make sure to rename your font file to font.ttf to replace the file in my folder.

                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">sample.png</span>
                    </div>
                    On an A4 sheet sized image (2480 x 3508), make your theme - the personality you want to give to the lottery ticket that&rsquo;s going in the hands of your audience. Make it according to the theme of the event or the section of the event when its played to make it more relatable and enjoyable to the audience.
                    <Image
                        className="my-4 mx-auto w-full max-w-xl md:max-w-2xl rounded-box h-auto object-contain"
                        src="/blogs/projects/TambolaTicketsGenerator/ticket.png"
                        alt="Tambola ticket example"
                        width={0}
                        height={0}
                        sizes="100vw"
                    />
                    Make 15 circles, or any kind of placeholder to put your numbers in. We will now resize this image to fit in a quarter of the image as A4 would be too big for a tambola ticket. Copy and paste the image 3 times to fill the empty space and have 4 of the exact same image.
                    <Image
                        className="my-4 mx-auto w-full max-w-xl md:max-w-2xl rounded-box h-auto object-contain"
                        src="/blogs/projects/TambolaTicketsGenerator/sample.png"
                        alt="Sample layout with 4 tickets"
                        width={0}
                        height={0}
                        sizes="100vw"
                    />
                    Rename your image <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">sample.png</span> and then replace it in my folder.
                    <br />
                    We&rsquo;re almost done! Now we just have to map the centre of the circles in our code.

                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-violet-600 from-sky-500">script.py</span>
                    </div>
                    Enter the<span className="font-mono text-slate-400 text-sm mx-2">Number of Tickets</span>you want to generate in line 18 of this file. Line 19 sets the font to the <span className="text-transparent bg-clip-text bg-gradient-to-r to-teal-400 from-cyan-600">font.ttf</span> from earlier. <u>60</u> is the size of the text, change this to fit the numbers in the placeholder circles better. Run the script to check if numbers need to be bigger or smaller.
                    <Image
                        className="my-4 mx-auto w-full max-w-3xl rounded-box h-auto object-contain"
                        src="/blogs/projects/TambolaTicketsGenerator/script.png"
                        alt="Script configuration example"
                        width={0}
                        height={0}
                        sizes="100vw"
                    />
					Once you have the <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">sample.png</span> created that has 4 tickets, populate the <i className="text-red-600">drawDestQuarter</i> variable with the pixel coordinates of the points on the first ticket of <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">sample.png</span>.
					<br />
					Run the script, you should see the Tickets folder filling up. Don&rsquo;t worry if the numbers appear weirdly on the tickets. You can easily make the necessary adjustments by changing the coordinates a little bit or font size. Running the script again will just replace old tickets with the new ones. 
                </div>
                <div className="text-3xl md:text-6xl my-4 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
                    Modifiablity Of My Code
                </div>
                <div>
                    I modified my code to make double tickets, i.e. tickets with 30 numbers. The easiest way to craft this was to double a few of the numbers. However, with a few tweaks, my code can make tickets however you want. <a className="text-blue-800 underline" href="https://fido27.tech/contact">Contact me</a> for special requests.
                    <br />
                    If you use my script for double tickets, all you have to do is map the coordinates for 30 circles in the <i className="text-red-600">drawDestQuarter</i> variable.
                </div>
            </div>
            </div>
        </div>
    );
}