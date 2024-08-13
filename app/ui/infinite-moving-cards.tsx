"use client";

import { Card, CardBody } from "@nextui-org/card";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "../utils/cn";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    id: string;
    src: string;
    title: string;
    desc: string;
    bloglink: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "30s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-2 w-max flex-nowrap",
          start && "animate-scroll ",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
				{items.map((item) => (
					<li
						className="group z-20 relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700"
						key={item.id}
					>
						<Card className = "w-[20vw] h-[20dvh] rounded-2xl">
							<Link href={item.bloglink}>
								<Image
									className={"object-cover relative w-full rounded-2xl transition-all duration-300 delay-150 group-hover:blur-sm"}
									src={item.src}
									alt={item.title + " Image"}
									height={0}
									width={1000}
								/>
							</Link>
						
							<CardBody className="absolute">
								<span className="mx-1">
									<span className={"absolute z-30 text-xl inset-y-22 inset-y-20 transition-all duration-500 group-hover:inset-y-4"}>
										{item.title}
									</span>
									<span className={"absolute z-30 text-sm opacity-0 inset-y-36 transition-all duration-500 group-hover:opacity-100 group-hover:inset-y-12"}>
										{item.desc}
									</span>
								</span>
							</CardBody>
						</Card>
					</li>
				))}
			</ul>
		</div>
	);
};