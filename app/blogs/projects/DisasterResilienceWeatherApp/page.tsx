import Image from "next/image";

const SECTIONS = [
  {
    title: "Why I’m Proud of This Project",
    items: [
      "It combines software engineering with civic responsibility.",
      "It uses real-world APIs and mapping tools to offer relevant data to users.",
      "It was a team effort, with collaboration on design, development, and testing across multiple views and modules in Xcode.",
      "Most importantly, it has potential for lifesaving impact, especially in areas vulnerable to frequent natural disasters.",
    ],
  },
  {
    title: "Challenges We Tackled",
    items: [
      "Scraping dynamic web content (Glassdoor) with strict anti-bot measures.",
      "Transforming inconsistent salary data (hourly, yearly, K-format) into usable numbers.",
      "Creating a responsive and minimal front end from scratch.",
      "Hosting and maintaining a stable Flask site with scheduled scraping tasks.",
      "Integrating ML models for salary prediction within the constraints of a student-led project.",
    ],
  },
];

const FINAL_THOUGHTS =
  "This project taught me that meaningful software doesn’t have to be massive — it just needs to solve a real problem. Whether it’s showing a weather warning or directing someone to the nearest safe shelter, good software removes friction during critical moments.";

export default function Blogs() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-fixed bg-center bg-cover bg-[url('/Background/coral_red.jpg')] before:content-[''] before:absolute before:inset-0 before:backdrop-blur-sm before:bg-black/40"></div>

      {/* Responsive Container */}
      <div className="relative z-10 px-6 py-12 md:px-32 md:py-20">
        <div className="py-10">
          <div id="blogPageStart" className="">
            <div
              id="blogTitle"
              className="p-6 text-4xl md:text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400"
            >
              Disaster Resilience / Weather App
            </div>
          </div>
          <div
            id="blogByLine"
            className="text-base md:text-lg text-center italic mt-3 mb-6"
          >
            <pre>
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-sky-500 from-emerald-500">
                - Aarav Jain
              </span>
            </pre>
          </div>
        </div>

        <div className="my-4 py-2 text-base md:text-[27px]/[1.7]">
          <div className="pt-2">
            During my time at Arizona State University, I enrolled in a course
            that challenged students to create software with real-world impact.
            The result? A disaster resilience app designed to help communities
            stay informed and prepared during natural emergencies.
            <br />
            <br />
            Our app started with a simple question: What if people could get
            immediate, localized insight into the natural disaster risks around
            them, all from their phone?
            <br />
          </div>

          <br />
          <br />

          <div className="text-3xl md:text-6xl my-4 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            What the app does
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Text Content */}
              <div className="md:col-span-3">
                <ul className="list-disc list-outside mx-4 md:mx-10 space-y-4 md:space-y-8">
                  <li>
                    <b>Live Weather Display:</b> Shows current weather conditions using live data.
                  </li>
                  <li>
                    <b>Disaster Risk Awareness:</b> Informs users about types of disasters common in their area (like floods, wildfires, earthquakes, or hurricanes).
                  </li>
                  <li>
                    <b>Preparedness Tips:</b> Offers actionable safety advice tailored to each disaster type.
                  </li>
                  <li>
                    <b>Resource Locator:</b> Uses maps to find nearby hardware stores, gas stations, hospitals, and safe zones.
                  </li>
                  <li>
                    <b>Community Leader Contact:</b> Displays contact info and guidance from a designated local representative for further help.
                  </li>
                </ul>
              </div>

              {/* Carousel */}
              <div className="md:col-span-2 carousel carousel-center rounded-box space-x-2 md:space-x-4">
                {[
                  "weather_app.png",
                  "info_page.png",
                  "nearby_resources.png",
                  "community_leader.png",
                  "disaster_resilience_program.png",
                  "login_page.png",
                ].map((img, i) => (
                  <div className="carousel-item w-48 sm:w-56 md:w-72 lg:w-96" key={i}>
                    <Image
                      className="my-2 rounded-box w-full h-auto object-contain"
                      src={`/blogs/projects/disaster_resilience_weather_app/${img}`}
                      alt={`Screenshot ${i + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tech Stack Section */}
          <div className="mt-8">
            <div className="text-3xl md:text-6xl my-4 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
              Tech Stack
            </div>
            <ul className="list-disc list-outside mx-4 md:mx-10 space-y-2">
              <li>Xcode & Swift (iOS app development)</li>
              <li>MapKit</li>
              <li>UIKit</li>
              <li>Storyboard</li>
              <li>Weather API</li>
            </ul>
          </div>

          {/* Additional Sections */}
          {SECTIONS.map((section, idx) => (
            <div key={idx} className="mt-8">
              <div className="text-3xl md:text-6xl my-4 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
                {section.title}
              </div>
              <ul className="list-disc list-outside mx-4 md:mx-10 space-y-2">
                {section.items.map((item, i2) => (
                  <li key={i2}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Final Thoughts as paragraph, not a list */}
          <div className="mt-8">
            <div className="text-3xl md:text-6xl my-4 py-2 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
              Final Thoughts
            </div>
            <p className="text-base md:text-[27px]/[1.7]">{FINAL_THOUGHTS}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
