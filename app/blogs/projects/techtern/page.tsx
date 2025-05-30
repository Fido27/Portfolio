import Image from "next/image";

export default function Blogs() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-fixed bg-center bg-cover bg-[url('/Background/black_sand_mountains.jpg')] before:content-[''] before:absolute before:inset-0 before:backdrop-blur-sm before:bg-black/40"></div>

      <div className="relative z-10 m-32 mx-64">
        <div className="py-10">
          <div id="blogPageStart" className="">
            <div
              id="blogTitle"
              className="p-9 text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400"
            >
              Techtern-Insight
            </div>
          </div>
          <div
            id="blogByLine"
            className="text-lg text-center italic mt-3 mb-10"
          >
            <pre>
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-sky-500 from-emerald-500">
                - Aarav Jain
              </span>
            </pre>
          </div>
        </div>
        <div className="my-6 text-[30px]/[1.7]">
          <div className="pt-4">
            Finding a good internship shouldn&apos;t feel like finding a needle
            in a haystack.
            <br />
            <br />
            My friends and I — a mix of students from{" "}
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-[#FDB913] bg-clip-text text-transparent">
              University of California Irvine
            </span>{" "}
            and{" "}
            <span className="text-3xl font-bold bg-gradient-to-r from-[#FDB913] to-[#8C1D40] bg-clip-text text-transparent">
              Arizona State University
            </span>{" "}
            teamed up to solve a problem we were all facing: the lack of a{" "}
            <b className="text-3xl ">centralized, accessible, and relevant</b>{" "}
            job board for software engineering internships.
            <br />
            <br />
            Thus, Techtern Insight was born — a web-based application designed
            to scrape, store, and display high-quality internship postings
            tailored to students. It’s not just a job board; it’s a
            purpose-built tool made by students, for students.
            <br />
            <br />
            <a
              className="text-blue-500 underline"
              href="https://techtern.fido27.me"
            >
              Live site here!
            </a>
          </div>

          <div className="m-16">
            <Image
              className="my-4"
              src="/blogs/projects/techtern-insight/Techtern Insight.jpeg"
              alt="Techtern-Insight Landing Page"
              width="3000"
              height="3000"
            />
            <Image
              className="my-4"
              src="/blogs/projects/techtern-insight/job-posting.png"
              alt="Techtern-Insight Job Postings Page"
              width="3000"
              height="3000"
            />
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Idea
          </div>
          <div>
            It started with our growing struggle with one thing: finding
            internships that <b>weren’t</b> either{" "}
            <i>outdated, super vague, or totally unrelated</i> to what we were
            looking for. Every job board felt like a cluttered mess — and we
            knew we could do better. <br />
            We wanted to fix that.
            <br />
            <br />
            So we asked ourselves:
            <ul className="list-disc list-outside m-10">
              <li>
                What if students had a tool that only showed the roles they
                cared about?
              </li>
              <li>
                What if we could scrape relevant job data and actually make
                sense of it?
              </li>
              <li>
                What if you could see trends like average pay, top cities, and
                top companies — without digging through a hundred tabs?
              </li>
            </ul>
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Tech Stack & Architecture
          </div>
          <div>
            <ul className="list-disc list-outside m-10">
              <li>
                <span className="text-rose-900 bold">Frontend:</span> HTML, CSS,
                JavaScript
              </li>

              <li>
                <span className="text-rose-900 bold">Backend: </span>Python
                Flask
              </li>

              <li>
                <span className="text-rose-900 bold">Database:</span> SQLite3 +
                MySQL
              </li>

              <li>
                <span className="text-rose-900 bold">Web Scraping:</span>{" "}
                BeautifulSoup4 + Selenium
              </li>

              <li>
                <span className="text-rose-900 bold">Data Visualization: </span>
                Plotly, Seaborn, and Matplotlib
              </li>

              <li>
                <span className="text-rose-900 bold">Machine Learning: </span>
                Salary prediction using Linear Regression, Lasso, and Random
                Forest
              </li>
            </ul>
            Our backend Flask app fetches data from a MySQL database populated
            via scheduled scrapers. The site&apos;s datasite page dynamically
            renders job listings, and stats provides interactive salary and
            location-based insights through rich visualizations.
          </div>

          <br />
          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Interactive Visual Insights
          </div>
          <div>
            We believe data should speak. Users can explore:
            <ul className="list-disc list-outside m-10">
              <li>Salary distribution across states</li>
              <li>Top-paying cities and companies</li>
              <li>Density plots and scatterplots of internship pay</li>
              <li>
                A predictive model to estimate salary ranges based on job
                attributes
              </li>
            </ul>
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Machine Learning for Pay Prediction
          </div>
          <div>
            We built salary prediction models using cleaned and encoded
            datasets. <br />
            These models achieved strong R² values and provided users with
            estimated pay data even when some listings lacked full salary
            details.
            <br />
            <br />
            Models used:
            <ul className="list-disc list-outside m-8">
              <li>Linear Regression</li>

              <li>Lasso Regression</li>

              <li>Random Forest Regression</li>
            </ul>
            This added analytical depth to our platform, making Techtern not
            just a job board — but a smart one.
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Challenges We Tackled
          </div>
          <div>
            <ul className="list-disc list-outside m-8">
              <li>
                Scraping dynamic web content (Glassdoor) with strict anti-bot
                measures
              </li>
              <li>
                Transforming inconsistent salary data (hourly, yearly, K-format)
                into usable numbers.
              </li>
              <li>Creating a responsive and minimal front end from scratch.</li>
              <li>
                Hosting and maintaining a stable Flask site with scheduled
                scraping tasks.
              </li>
              <li>
                Integrating ML models for salary prediction within the
                constraints of a student-led project.
              </li>
            </ul>
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Meet the Team
          </div>
          <div>
            <ul>
              <li />
              Sushant Gupta - Tech Lead
              <li />
              Shanni W. - Fullstack Developer
              <li />
              Derek Xu - Backend Developer
              <li />
              Fay Alrumaihi - ML Model Developer
              <li />
              Aarav Jain (me) - Site Manager & Deployment Specialist
            </ul>
						<br/>
            Together, we iterated through bugs, design pivots, and late-night
            debugging sessions — learning as much about teamwork as we did about
            tech.
          </div>

          <div className="text-6xl my-5 text-transparent bg-clip-text bg-gradient-to-r to-purple-600 from-sky-400">
            Final Thoughts
          </div>
          <div>
            Techtern Insight was more than a summer side project — it was a
            collaborative solution to a shared pain point. It showcases our
            ability to build, deploy, and iterate on a product with real user
            impact. If you&apos;re a recruiter or collaborator interested in
            smart, data-driven job platforms — let&apos;s connect!
          </div>
        </div>
      </div>
    </div>
  );
}
