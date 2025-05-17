/*import { gsap } from "https://cdn.skypack.dev/gsap@3.12.2";

(function () {
  //const params = new URLSearchParams(location.search);
  //const enabled = params.get("sidepanel") === "true";
  //if (!enabled) return;

  const FAB_KEYS = ["lang", "open", "theme"];
  const FAB_ICONS = {
    lang: "🌐",
    open: "⚙️",
    theme: "🎨"
  };

  const container = document.createElement("div");
  container.id = "fab-cluster";
  document.body.appendChild(container);

  renderFABCluster(container);

  // Initial render
  function renderFABCluster(wrapper) {
    wrapper.innerHTML = "";

    const cluster = document.createElement("div");
    cluster.className = "fab-cluster";

    FAB_KEYS.forEach(key => {
      const btn = document.createElement("button");
      btn.className = `fab fab-${key}`;
      btn.textContent = FAB_ICONS[key];
      btn.onclick = () => handleFABClick(key);
      cluster.appendChild(btn);
    });

    wrapper.appendChild(cluster);
  }

  function handleFABClick(key) {
    if (key === "open") {
      morphFABsToPanel();
    } else if (key === "lang") {
      cycleLanguage(); // placeholder
    } else if (key === "theme") {
      cycleTheme(); // placeholder
    }
  }

  function morphFABsToPanel() {
    const cluster = document.querySelector(".fab-cluster");
    const openBtn = cluster.querySelector(".fab-open");

    // Freeze open button state
    const bounds = openBtn.getBoundingClientRect();
    const ghost = openBtn.cloneNode(true);
    ghost.classList.add("fab-morphing");
    document.body.appendChild(ghost);

    gsap.set(ghost, {
      position: "fixed",
      top: bounds.top,
      left: bounds.left,
      width: bounds.width,
      height: bounds.height,
      borderRadius: "50%",
      zIndex: 100
    });

    // Fade out other FABs
    gsap.to(".fab", {
      opacity: (i, el) => (el === openBtn ? 1 : 0),
      duration: 0.2
    });

    // Morph ghost into panel container
    gsap.to(ghost, {
      duration: 0.5,
      width: 300,
      height: 400,
      top: "50%",
      left: "calc(100% - 320px)",
      borderRadius: "1rem",
      ease: "power3.inOut",
      transform: "translateY(-50%)",
      onComplete: () => {
        ghost.remove();
        cluster.remove();
        renderAssistantPanel();
      }
    });
  }

  function renderAssistantPanel() {
    const panel = document.createElement("div");
    panel.className = "assistant-panel";
    panel.innerHTML = /html/ `
    <div class="assistant-header">
        <span>Assistant Panel</span>
        <button class="close-btn">×</button>
    </div>
    <div class="assistant-body">
        <div class="tab-bar-vertical">
        <button class="tab active">🧭 Nav</button>
        <button class="tab">🌐 Lang</button>
        <button class="tab">⚙️ Layout</button>
        <button class="tab">🎨 Theme</button>
        </div>
        <div class="tab-content">[Tab content placeholder]</div>
    </div>
    `;

    panel.querySelector(".close-btn").onclick = () => {
      panel.remove();
      renderFABCluster(document.getElementById("fab-cluster"));
    };

    document.body.appendChild(panel);
  }

  function cycleLanguage() {
    console.log("Language toggled");
  }

  function cycleTheme() {
    console.log("Theme toggled");
  }
})();*/
