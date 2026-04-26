function analyzeJob() {
    const text = document.getElementById("jobText").value;
    if(!text) return alert("Please enter text first!");

    fetch("/predict", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ text })
    })
    .then(res => res.json())
    .then(data => {
        const risk = data.risk_score;
        document.getElementById("riskValue").innerText = risk + "%";
        
        let color = risk > 60 ? "#ef4444" : (risk > 30 ? "#facc15" : "#22c55e");
        document.getElementById("progressCircle").style.borderColor = color;
        document.getElementById("riskValue").style.color = color;

        const predictionText = document.getElementById("predictionText");
        predictionText.innerText = data.prediction === "Fake" ? "🚨 Likely Scam" : "🎉 Likely Legitimate";
        predictionText.style.color = color;

        document.getElementById("financialBar").style.width = data.flags.some(f => f.includes("Payment")) ? "95%" : "5%";
        document.getElementById("urgencyBar").style.width = data.flags.some(f => f.includes("Urgency")) ? "90%" : "10%";
        document.getElementById("contactBar").style.width = data.flags.some(f => f.includes("WhatsApp")) ? "85%" : "5%";

        const flagsDiv = document.getElementById("flags");
        flagsDiv.innerHTML = "";
        data.flags.forEach(f => {
            const div = document.createElement("div");
            div.className = "flag";
            div.innerText = "⚠ " + f;
            flagsDiv.appendChild(div);
        });

        if (data.prediction === "Fake") {
            document.getElementById("reason").value = data.reason;
            document.getElementById("reportDesc").value = text; 
        }
    });
}
function submitReport() {
    const company = document.getElementById("company").value;
    const description = document.getElementById("reportDesc").value;
    const reason = document.getElementById("reason").value;

    if(!company || !description) return alert("Please fill in Company and Description!");

    fetch("/report", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ company, description, reason })
    })
    .then(res => res.json())
    .then(data => {
        const msg = document.getElementById("reportMsg");
        msg.innerText = "✅ " + data.message;
        msg.style.color = "#22c55e";
        
        document.getElementById("company").value = "";
        document.getElementById("reportDesc").value = "";
        document.getElementById("reason").value = "";
    })
    .catch(err => alert("Error submitting report"));
}

// --- LIVE NEWS FEED API ---
async function loadLiveNews() {
    const container = document.getElementById("newsContainer");
    
    try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews');
        const data = await response.json();
        
        container.innerHTML = ""; 
        
        const topArticles = data.items.slice(0, 3);
        const borderColors = ["#facc15", "#3b82f6", "#22c55e"];
        
        topArticles.forEach((article, index) => {
            let cleanSnippet = article.description.replace(/<[^>]+>/g, '').split('. ')[0] + "...";
            
            container.innerHTML += `
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; min-width: 280px; flex: 1; border-top: 3px solid ${borderColors[index]};">
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">🕒 Published: ${article.pubDate.split(' ')[0]}</p>
                    <h4 style="margin: 0 0 8px 0; font-size: 15px;">
                        <a href="${article.link}" target="_blank" style="color: ${borderColors[index]}; text-decoration: none;">
                            ${article.title}
                        </a>
                    </h4>
                    <p style="font-size: 13px; color: #ccc; margin: 0; line-height: 1.4;">${cleanSnippet}</p>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `<p style="color: #ef4444;">⚠ Could not connect to live threat feed. Running offline.</p>`;
    }
}

window.onload = loadLiveNews;