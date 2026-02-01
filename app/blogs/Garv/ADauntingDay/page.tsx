export default function Blogs() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-fixed bg-center bg-cover bg-[url('/Background/fern_leaves.jpg')] before:content-[''] before:absolute before:inset-0 before:backdrop-blur-xs before:bg-black/20"></div>

      {/* Responsive Container */}
      <div className="relative z-10 px-6 py-12 md:px-32 md:py-20">
        <div className="py-10">
          <div id="blogPageStart" className="">
            <div
              id="blogTitle"
              className="p-6 text-4xl md:text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400"
            >
              A Daunting Day
            </div>
          </div>
          <div
            id="blogByLine"
            className="text-base md:text-lg text-center italic mt-3 mb-6"
          >
            <pre>
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-sky-500 from-emerald-500">
                - Garv Jain
              </span>
            </pre>
          </div>
        </div>

        <div className="my-4 py-2 text-base md:text-[27px]/[1.7]">
          <div className="pt-2">
            <br />
            It was a magnificent moment. I had finally entered the doors of Christ University as an undergraduate. After months of meticulous planning, various entrance exams, I was finally here.<br /><br />
Walking through the campus a gush of wind flew by me, this is my first venture into uncharted territory. How would I be able to survive without my parents guiding my every path? I trudged on thinking if I made the right decision, if I would be able to live up to the great expectations and standards set by my parents.<br /><br />
The campus is vibrant, people everywhere from every part of the country and even from other countries. There were various stalls set up showcasing the diverse activities that I would have to engage myself throughout my five years as a law student. The moment was surreal. I made my way to the auditorium where the orientation took place. I was in awe seeing the rich history of the campus. We were all asked to form queues according to the courses we took and the seniors led us to our classrooms. We were orientated with our new professors (as we call it here and our benchmates. I hope to make good friendships with them.<br /><br />
The classroom was alive which was a sharp contrast to the dull and boring environment of my previous schools (mostly due to oversaturation). Every corner of the room was engaged in some form of conversation. I tried to fit in with them but atleast I know that some things never change.<br /><br />
The seniors made us sign an attendance sheet which according to him was more important than food or water for the survival of human beings in this esteemed university or deemed to be university.<br /><br />
I am finally out of the cocoon that I had concocted. The fresh faces will surely help to push me out of my comfort zone. The challenging committees will invoke soft skills in me which I desperately need. I will become the best version of myself.<br /><br />
          </div>

        </div>
      </div>
    </div>
  );
}
