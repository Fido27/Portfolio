import { HoverBorderGradient } from "../../lib/ui/hover-border-gradient";
import { InfiniteMovingCards } from "../../lib/ui/infinite-moving-cards";
import { projList , guideList , thotsList } from "./list";
import { Meteors } from "@/lib/ui/meteors";

export default function Blogs() {
    return (
        <div className="flex h-screen items-center mx-8">

            <div className="basis-2/3 overflow-hidden">

                <InfiniteMovingCards
                    items={projList}
                    direction="right"
                    speed="fast"
                />
                <InfiniteMovingCards
                    items={guideList}
                    direction="left"
                    speed="normal"
                />
                <InfiniteMovingCards
                    items={thotsList}
                    direction="right"
                    speed="slow"
                />

            </div>

            <div className="flex-none border-2 h-1/2 m-8"></div>

            <div className="basis-1/3 grid grid-cols-2 grid-flow-row gap-4">


                <HoverBorderGradient
                    containerClassName="w-full aspect-square rounded-3xl relative overflow-hidden"
                    as="button"
                    duration={0.8}
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center"
                >
                    <Meteors/>
                    <span className="text-2xl font-bold">Projects</span>
                </HoverBorderGradient>

                
                <HoverBorderGradient
                    containerClassName="w-full aspect-square rounded-3xl relative overflow-hidden"
                    as="button"
                    duration={1.2}
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center"
                >
                    <Meteors/>
                    <span className="text-2xl font-bold">Guides</span>
                </HoverBorderGradient>

                <HoverBorderGradient
                    containerClassName="w-full aspect-square rounded-3xl relative overflow-hidden"
                    as="button"
                    duration={1}
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center"
                >
                    <Meteors/>
                    <span className="text-2xl font-bold">Thoughts</span>
                </HoverBorderGradient>

                <HoverBorderGradient
                    containerClassName="w-full aspect-square rounded-3xl relative overflow-hidden"
                    as="button"
                    duration={1}
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center"
                >
                    <Meteors/>
                    <span className="text-2xl font-bold">Misc</span>
                </HoverBorderGradient>
                
            </div>

        </div>
    );
}