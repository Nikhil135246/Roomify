import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import Upload from "../../components/upload";
import { ArrowUpRight, ArrowRight, Clock, Layers } from "lucide-react";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router";
import { useState } from "react";
import { createProject } from "../../lib/puter.action";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {

  const navigate = useNavigate();

  const [projects, setProjects] = useState<DesignItem[]>([]);

  const handleUploadComplete = async (base64Data: string) => {
    const newId = Date.now().toString();

    const name = `Residence ${newId}`;

    const newItem = {
      id: newId,
      name,
      sourceImage: base64Data,
      renderedImage: undefined,
      timestamp: Date.now()
    }

    const saved = await createProject({ item: newItem, visibility: "private" });

    if (!saved) {
      alert("Failed to save project. Please try again.");
      return false;
    }

    setProjects((prev) => [newItem, ...prev]);

    navigate(`/visualizer/${newId}`, {
      state: {
        initialImage: saved.sourceImage,
        initialRendered: saved.renderedImage || null,
        name,
        base64Data
      },

    });
    return true;
  }


  return (
    <div className="home">
      <Navbar />

      <section className="hero">
        <div className="announce">
          <div className="dot">
            <div className="pulse"></div>
          </div>
          <p>Introducing Roomify 2.0</p>
        </div>
        <h1>Build beautiful spaces at the speed of thought with Roomify</h1>
        <p className="subtitle">
          Roomify is an AI-first design environment that helps you visualize, render, and ship architecture projects faster then ever.
        </p>
        <div className="actions">
          <a href="#upload" className="cta">
            Start Building <ArrowRight className="icon" />
          </a>
          <Button variant="outline" size="lg" className="demo">Watch Demo</Button>

        </div>
        <div id="upload" className="upload-shell">
          <div className="grid-overlay" />
          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers className="icon" />
              </div>
              <h3>Upload Your Design</h3>
              <p>Supports JPG, PNG , formats upt to 10 MB</p>
            </div>
            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>


      <section className="projects" >

        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>
                Projects
              </h2>
              <p>
                Your latest work and shared community projects, all in one place.
              </p>

            </div>
          </div>
          <div className="projects-grid">
            {projects.map(({ id, name, sourceImage, renderedImage, timestamp }) => (

              <div key={id} className="project-card group">

                <div className="preview">
                  <img src={renderedImage || sourceImage } alt="project" />

                  <div className="badge">
                    <span>
                      Community
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    <h3>
                      name
                    </h3>
                    <div className="meta">
                      <Clock size={12} />
                      <span>
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                      <span>By Nikhil</span>
                    </div>
                  </div>
                  <div className="arrow">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </section>
    </div>
  )
}
