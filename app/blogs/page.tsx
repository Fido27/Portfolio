import { blogCard } from "./blogCard";

export default function Blogs() {
    return (
        <div>
            {blogCard("yo" , "/pic.jpg" , "Tambola Ticket Generator" , "Python Script")}
        </div>
    );
}