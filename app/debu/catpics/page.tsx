import Image from "next/image"
import Link from 'next/link';

export default function Catpics(){
    return (
        <div>
            Here is a picture of my 2 favorite cats.<br/>
            <a href="https://www.instagram.com/smallcutecats/?hl=en">Click here</a> for more cat pics.
            <Image
                className="object-cover relative"
                src="/catpic.jpg"
                alt="Cat pic"
                height={0}
                width={1600}
            /><br/><br/>
            <div>
                Other things you might be interested in: 
                <li><Link href="/debu/catpics">Cat pics</Link></li>
                <li><Link href="/debu/thingsiwannado">Things I wanna do with you</Link></li>
                <li><Link href="/debu/bestie">Bestie Stuff</Link></li>
                <li><Link href="/debu/mean">Mean things I wanna say</Link></li>
                <li><Link href="/debu/nextsteps">Next Steps</Link></li>
            </div>
        </div>
    )
}