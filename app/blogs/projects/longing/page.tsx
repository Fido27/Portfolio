import Image from "next/image"

export default function Blogs() {
    return (
        <div className="m-32">
            <div id="blogPageStart" className="h-full">
                <div id="blogTitle" className="text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
                    Longing
                </div>
            </div>
            <div id="blogByLine" className="text-lg text-center italic mt-3 mb-10">
                <pre>                  <span className="text-transparent bg-clip-text bg-gradient-to-r to-sky-500 from-emerald-500">- Aarav Jain</span></pre>
            </div>
            
            <div className="my-5">
                <div className="pt-4">
                    Ever had a bond stronger than covalent with someone that keeps you longing for them? Distance makes the heart grow fonder, presence makes it stronger. Long-distance relationships can take a toll on the relationship and on mental health. Watching movies and shows can be fun for a while but its a mere means of whiling away time when there are a lot more valueble experiences that can keep the love aflame. 
                </div>
                <div className="text-4xl my-5">
                    Introducing Longing
                </div>
                <div>
                    Longing is a free social media for couples who are looking for date ideas to try new things as well as share their own unique ideas to the world. This app lets you countdown to the next annivarsary, next birthday, next virtual date and next inperson date. It has a lot of synced features like leaving cute messages to your partner, track a book that you&apos;re both reading, and many more for you to discover. 
                    <br/>
                    Android users can download longing from <a href="/longing.apk" className="text-blue-500">here</a>.
                </div>
                <div className="text-4xl my-5">
                    Showcase
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <Image
                        src = "/blogs/projects/longing/login.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/signup.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/saved.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/ideaspage.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/carddemo_filter.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/messagecard.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/bookcard.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                    <Image
                        src = "/blogs/projects/longing/addcard.png"
                        alt = "Sample Parallax image"
                        width = "3000"
                        height = "3000"
                    />
                </div>

                <div className="text-4xl my-5">
                    How to use Longing
                </div>
                <div>
                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">Signup</span>
                    </div>
                    During the signup process, fill details and add your partners email that they&apos;re going to use for their signup. Syncing automatically starts from here.

                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-teal-400 from-cyan-600">Saving ideas</span>
                    </div>
                    From the &lsquo;Ideas&rsquo; page, heart the ideas that you would like to show up on the saved page. Some ideas have customizations built in like in the Book Club idea, you can enter the name of the book both of you are reading and the page number each of you are, or the message idea where you can put a message for your partner to read. <span className="italic">The ideas that you save will be saved for your partner as well.</span>
                    
                    <div className="text-2xl italic my-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r to-teal-400 from-cyan-600">Adding your own ideas</span>
                    </div>
                    The add button on the &lsquo;Saved&rsquo; ideas page will let you add your own innovative ideas. Title and the long description is what shows when the ideas are tapped on (the screen that comes from the bottom) and the short description is is the one that is showed under title in the saved page.
                </div>

                <div className="text-4xl my-5">
                    From the author
                </div>
                <div>
                    If you would like to publish your ideas to the world, or change something about your account or want to share some feedback, contact me.
                </div>
            </div>
        </div>
    );
}