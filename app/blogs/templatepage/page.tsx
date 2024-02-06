import Image from "next/image"

export default function Blogs() {
    return (
        <div className="m-20">
            <div className="text-6xl text-center">
                Title
            </div>
            <div className="text-lg text-center italic">
                <pre>                By Aarav Jain <br /><br /></pre>
            </div>
            <div>
                Every year, many students have difficulty navigating campus, especially those who are visually impaired. ASU lacks the ability to help these students efficiently navigate campus and arrive at class on time.
            </div>
            <div className="text-3xl my-2">
                About this Project
            </div>
            <div>
                Audible Maps provides real-time audio maps and navigation. Its a mobile app that offers customizable navigation routes and markers and can track user`&apos;`s location and give turn-by-turn audible feedback to the user for better understandings of their surroundings and better guidance to their destination.
            </div>
            <div className="text-3xl my-2">
                Business Model
            </div>
            <div>
                We will have a one time charge for the development of the maps curated to the universities we partner with and a monthly payment plan for the upkeep and maintenance like if buildings get renamed or more infrastructure is added.
            </div>
            <div className="text-3xl my-2">
                Progress
            </div>
            <div>
                Live location tracking, entrances to buildings and waypoint polyline graphs have already been implemented. The app can detect buildings in a radius of 35 feet from the user. The app can tell the walking ETA from user`&apos;`s current location to the destination.
            </div>
        </div>
    );
}