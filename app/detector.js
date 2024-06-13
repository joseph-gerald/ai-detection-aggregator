const query_text_elm = document.getElementById("query_content")
const sumbit = document.getElementById("submit_query");
const resultTitle = document.querySelector(".search-result-title");
const resultsContainer = document.querySelector(".results-container");
const results = document.querySelector(".results");
const requery = document.getElementById("requery");
let started = false;
let currentRun = 0;
let failCount = 0;

let BASE_URL = "https://api.jooo.tech/query";

function getLevel(ai) {
    if (ai < 0.3) return "✔️";
    if (ai < 0.5) return "⚠️";
    if (ai < 0.7) return "❓";
    return "🚨";

}

function addLoader() {
    const resultDiv = document.createElement("div");
    resultDiv.style.height = "100%"
    resultDiv.style.display = "flex"
    resultDiv.style.flexDirection = "column"
    resultDiv.innerHTML = `
    <div class="loader-51">
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
<span></span>
</div>
    `
    results.appendChild(resultDiv)
}

const setTitleToTopRight = async () => {
    if (started) return;
    started = true;
    const searchForm = document.querySelector(".search-form");
    const glowBox = document.querySelector(".glow-box")
    setTimeout(() => {
        resultTitle.style.marginTop = "-3px";
    }, 500);
    searchForm.style.position = "fixed";
    searchForm.style.bottom = -(searchForm.offsetHeight / 2 - 23) + "px";
    const requery = document.getElementById("requery");
    requery.style.bottom = "30px";
    requery.style.rotate = "0deg";
    glowBox.style.bottom = "-60px";
    resultsContainer.style.filter = "blur(0px) opacity(1)";
}

const setTitleBack = async () => {
    if (!started) return;
    started = false;
    const searchForm = document.querySelector(".search-form");
    const glowBox = document.querySelector(".glow-box")
    setTimeout(() => {
        resultTitle.style.marginTop = "-3px";
    }, 500);
    searchForm.style.position = "fixed";
    searchForm.style.bottom = "50%";
    requery.style.bottom = "-180px";
    requery.style.rotate = "-180deg";
    glowBox.style.bottom = "-160px";
    resultsContainer.style.transitionDuration = "1s";
    resultsContainer.style.filter = "blur(30px) opacity(0)";
    setTimeout(() => {
        requery.style.rotate = "180deg";
    }, 500)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function perform_query(query_text) {
    if (query_text.length == 0) {
        query_text_elm.placeholder = "Please type something...";
        query_text_elm.focus();
        return;
    }
    query_text_elm.placeholder = "Search Now";
    sumbit.style.backgroundColor = "var(--primary-button-color)";
    results.innerHTML = "";
    perform_ai_detection(query_text)
}

function createMarkedTextElement(query_results, query_text) {

    const gptzero = query_results.gptzero;
    const zerogpt = query_results.zerogpt;

    const markedText = document.createElement("div");
    markedText.classList.add("result")
    markedText.style.height = "100%"
    markedText.style.display = "flex"
    markedText.style.flexDirection = "column"

    let highlighted_text = "";

    for (const part of gptzero.data) {
        const ai_prob = part["generated_prob"]
        const highlight = ai_prob > 0.9 ? "--ai-highlight" : "--human-highlight";
        const new_text = `<span style="background-color: var(${highlight});">${part.sentence}</span>`;
        highlighted_text += new_text
        //console.log(new_text)
    }
    console.log("ZEROGPT: " + gptzero.data.length)

    let marked_text = highlighted_text;
    console.log("ZEROGPT: " + zerogpt.sus_sentences.length)
    for (const index in zerogpt.sus_sentences) {
        const sentence = zerogpt.sus_sentences[index];
        const ai_prob = 1;
        const highlight = ai_prob > 0.3 ? "--ai-highlight" : "--human-highlight";
        marked_text = marked_text.replaceAll(" " + sentence, `<span style="background-color: var(${highlight});"> ${sentence}</span>`)
        marked_text = marked_text.replaceAll(sentence, `<span style="background-color: var(${highlight});">${sentence}</span>`)
    }

    markedText.innerHTML = `
    <h2 style="margin: 0">marked text</h2>
    <h6 style="margin-top: 4px;">MAJORITY HUMAN WRITER LIKELYHOOD %:</h6>
    <div style="width: 100%; display: flex; border: solid 1px var(--main-border-color); border-radius: 4px; background-color: var(--main-shadow-color); padding: 4px 0; overflow: hidden; margin-top: 2px; margin-bottom: 6px; font-weight: bold; font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">
        <h6 style="width: 100%; text-align: center;">ZEROGPT - ${zerogpt.human_score}%</h6>
        <h6 style="width: 100%; text-align: center;">GPTZERO - ${(1 - Math.round((gptzero.completely_generated_prob - 0.01) * 1.01010101)) * 100}%</h6>
        <h6 style="width: 100%; text-align: center;">AVERAGE - ${(((1 - Math.round((gptzero.completely_generated_prob - 0.01) * 1.01010101)) * 100) + zerogpt.human_score) / 2}%</h6>
    </div>
    <h6 style="margin-top: 4px;">ROBOT VERDICT LEGEND:</h6>
    <div style="width: 100%; display: flex; border-radius: 4px; overflow: hidden; margin-top: 4px; margin-bottom: 8px; font-weight: bold; font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">
        <span style="width: 100%; text-align: center; background: linear-gradient(90deg, var(--ai-highlight), var(--mix-highlight))">2</span>
        <span style="width: 50%; text-align: center; background: linear-gradient(90deg, var(--mix-highlight), var(--mix-highlight))">1</span></span>
        <span style="width: 100%; text-align: center; background: linear-gradient(90deg, var(--mix-highlight), var(--human-highlight));">0</span>
    </div>
    <h6 style="margin: 0">${marked_text}</h6>`

    return markedText;
}

function doXORCipher(str, key) {
    var code = '';
    for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        var result = charCode ^ (key + i) % 132;
        code += String.fromCharCode(result);
    }
    return btoa(encodeURI(code)).split("=").join("").split("").reverse().join("");
}

async function perform_ai_detection(query_text) {
    if (sumbit.value != "Submit") return;
    currentRun++;
    setTitleToTopRight();
    sumbit.value = "...";
    sumbit.classList.add("clicked")

    resultTitle.innerText = "Querying..."

    const startTime = Date.now();

    var query_results = undefined;
    try {
        query_results = await getDetectionResults(query_text);
        failCount = 0;
        results.innerHTML = "";
    } catch (error) {
        failCount++;
        if (failCount < 3) {
            const message = `Retrying... (attempt ${failCount})`;

            results.innerHTML = "";
            sumbit.value = "Submit";

            const resultDiv = document.createElement("div");
            resultDiv.classList.add("result")
            resultDiv.style.height = "100%"
            resultDiv.style.display = "flex"
            resultDiv.style.flexDirection = "column"

            resultDiv.innerHTML = message
            console.warn(message)

            results.appendChild(resultDiv)

            perform_ai_detection(query_text);
            return;
        }
        console.error(error)
        resultTitle.innerText = `ERROR - COULD NOT REACH API`
        const resultDiv = document.createElement("div");
        resultDiv.classList.add("result")
        resultDiv.style.height = "100%"
        resultDiv.style.display = "flex"
        resultDiv.style.flexDirection = "column"
        resultDiv.style.background = "linear-gradient(165deg, var(--primary-button-color-block), var(--main-border-color-focused-block))"
        document.querySelector(".search-result-title").style.backgroundColor = "var(--primary-button-color-block)"
        resultDiv.innerHTML = `
        <h3 style="margin: 0">FATAL ERROR</h3>
        ${error}
        `
        results.appendChild(resultDiv)
        requery.style.bottom = "-180px";
        requery.style.rotate = "-180deg";
        return
    }

    resultTitle.innerText = `Finished Querying in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`

    addResults(query_results, query_text);
}

async function addResults(query_results, query_text) {
    results.appendChild(createMarkedTextElement(query_results, query_text))

    for (const key of Object.keys(query_results)) {
        const result = query_results[key]
        const resultDiv = document.createElement("div");
        resultDiv.classList.add("result")
        resultDiv.style.height = "100%"
        resultDiv.style.display = "flex"
        resultDiv.style.flexDirection = "column"
        switch (key) {
            case "roberta":
                const query_array = result["query_array"];
                let index = 0;
                let ai_combine = "";
                let average_ai = 0;
                let top_ai = 0;
                for (const part of query_array) {
                    const roberta_obj = result.response[index]
                    const roberta_verdict = { [roberta_obj[0]["label"].toUpperCase()]: roberta_obj[0]["score"], [roberta_obj[1]["label"].toUpperCase()]: roberta_obj[1]["score"] }
                    ai_combine += `<h4 style="margin: 0; opacity: 0.75; padding-left: 3px; border-left: 2px black groove;">AI: ${Math.round(roberta_verdict.FAKE * 100)}%</h4><h6 style="margin: 2px">${part}</h6>`
                    index++;
                    if (roberta_verdict.FAKE > top_ai) top_ai = roberta_verdict.FAKE
                    average_ai += roberta_verdict.FAKE;
                }
                average_ai /= query_array.length;
                resultDiv.innerHTML =
                    `
                    <div style="display: flex; justify-content: space-between">
                    <h3 style="margin: 0">roberta <small><code>@ hf.co (legacy/outdated)</code></small></h3>
                        <span>
                            ${getLevel(average_ai)}
                        </span>
                    </div>
                    <hr style="width: 100%">
                    <p style="margin: 0"><b>AVG ROBOT - </b>${Math.round(average_ai * 100)}%</p>
                    <p style="margin: 0"><b>TOP ROBOT - </b>${Math.round(top_ai * 100)}%</p>
                    <i style="cursor: pointer; font-size: 10px; margin-top: 4px;" id="roberta_switch" onclick="roberta.hidden=false; roberta_switch.hidden=true;">SHOW PARTS</i>
                    <div id="roberta" hidden>
                        ${ai_combine}
                    </div>
                `
                break;
            case "gltr":
                const adjustedGrade = (((result.average_score) * (result.sus_score) * (result.sussy_scores - 0.7) / (result.average_rank)) - 0.05) * 10 * 100;
                resultDiv.innerHTML =
                    `
                    <div style="display: flex; justify-content: space-between">
                    <h3 style="margin: 0">gltr.io <small><code>(legacy/outdated)</code></small></h3>
                        <span>
                            ${getLevel(adjustedGrade / 100)}
                        </span>
                    </div>
                    <hr style="width: 100%">
                    <p style="margin: 0"><b>AAG / AI %</b> - ${(Math.min(100, Math.max(adjustedGrade, 0))).toFixed(0)}%</p>
                    <i style="cursor: pointer; font-size: 10px; margin-top: 4px;" id="nerdinfoswitch_gltr" onclick="nerd_info_gltr.hidden=false; nerdinfoswitch_gltr.hidden=true;">NERD INFO</i>
                    <div id="nerd_info_gltr" hidden>
                        <hr style="width: 100%">
                        <b>AVERAGE RANK </b>${result.average_rank} 
                        <br>
                        <b>AVERAGE SCORE </b>${result.average_score}
                        <br>
                        <b>SUS SCORE </b>${result.sus_score}
                        <br>
                        <b>SUSSY SCORES </b>${result.sussy_scores}
                    </div>
                `
                break;
            case "seoai":
                resultDiv.innerHTML =
                    `
                    <div style="display: flex; justify-content: space-between">
                        <h3 style="margin: 0">seo.ai <small><code>(legacy/outdated)</code></small></h3>
                        <span>
                            ${getLevel(
                        (result.prediction + result.entropy + result.correlation + result.perplexity) / 4
                            )}
                        </span>
                    </div>
                    <hr style="width: 100%">
                    <p style="margin: 0"><b>AI %</b> - ${Math.round((result.prediction + result.entropy + result.correlation + result.perplexity) / 4) * 100}%</p>
                    
                    <i style="cursor: pointer; font-size: 10px; margin-top: 4px;" id="nerdinfoswitch_seo" onclick="nerd_info_seo.hidden=false; nerdinfoswitch_seo.hidden=true;">NERD INFO</i>
                    <div id="nerd_info_seo" hidden>
                        <hr style="width: 100%">
                        <b>AVG %</b> - ${Math.round((result.mean - 0.01) * 100 * 1.01010101)}%
                        <br>
                        <b>PREDICTION </b>${result.prediction} 
                        <br>
                        <b>ENTROPY </b>${result.entropy}
                        <br>
                        <b>CORRELATION </b>${result.correlation}
                        <br>
                        <b>PERPLEXITY </b>${result.perplexity}
                    </div>
                `
                break;
            case "gptzero":
                let highlighted_text = "";
                let highlighted_text_replaced = query_text;
                for (const part of result["data"]) {
                    const ai_prob = part["generated_prob"]
                    const highlight = ai_prob > 0.9 ? "--ai-highlight" : "--human-highlight";
                    const new_text = `<span style="background-color: var(${highlight});">${part.sentence}</span>`;
                    highlighted_text_replaced = highlighted_text_replaced.replace(part.sentence, new_text)
                    highlighted_text += new_text
                    //console.log(new_text)
                }
                result.completely_generated_prob = Math.round((result.completely_generated_prob - 0.01) * 1.01010101);
                const robot_prob = result.completely_generated_prob; // Math.max(Math.min(-Math.pow(result.completely_generated_prob,2)+result.completely_generated_prob*3-0.01,1),0); // Logarithmic Growth
                resultDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between">
                        <h3 style="margin: 0">gptzero.me</h3>
                        <span>
                            ${getLevel(robot_prob)}
                        </span>
                    </div>
                    <hr style="width: 100%">

                    <div style="
                        background: linear-gradient(to right, var(--ai-highlight) ${robot_prob * 100}%, transparent ${robot_prob * 100}%) no-repeat;
                        background-color: var(--main-shadow-color);
                        width: calc(100% - 10px);
                        font-size: 10px;
                        font-weight: bold;
                        padding: 4px 6px;
                        display: flex;
                        gap: 2px;
                    ">
                        <span style="min-width: 22px; display: block;">${Math.round(robot_prob * 100)}%</span> / ROBOT
                    </div>

                    <div style="
                        background: linear-gradient(to right, var(--human-highlight) ${100 - robot_prob * 100}%, transparent ${100 - robot_prob * 100}%) no-repeat;
                        background-color: var(--main-shadow-color);
                        width: calc(100% - 10px);
                        font-size: 10px;
                        font-weight: bold;
                        padding: 4px 6px;
                        display: flex;
                        gap: 2px;
                    ">
                        <span style="min-width: 22px; display: block;">${Math.round(100 - robot_prob * 100)}%</span> / HUMAN
                    </div>

                    <br style="margin-top: 4px;">

                    <i style="cursor: pointer; font-size: 10px;" id="gptzero_text_switch" onclick="gptzero_text.hidden=false; gptzero_text_switch.hidden=true;">SHOW MARKED TEXT</i>
                    <h6 id="gptzero_text" style="margin: 0" hidden>${highlighted_text}</h6>`
                break;
            case "zerogpt":
                let marked_text = `<span style="background-color: var(--human-highlight);">` + query_text;
                for (const index in result.sus_sentences) {
                    const sentence = result.sus_sentences[index];
                    const ai_prob = 1;
                    const highlight = ai_prob > 0.3 ? "--ai-highlight" : "--human-highlight";
                    marked_text = marked_text.replaceAll(" " + sentence, `</span><span style="background-color: var(${highlight});"> ${sentence}</span><span style="background-color: var(--human-highlight);">`)
                    marked_text = marked_text.replaceAll(sentence, `</span><span style="background-color: var(${highlight});">${sentence}</span><span style="background-color: var(--human-highlight);">`)
                }
                resultDiv.innerHTML =
                    `
                    <div style="display: flex; justify-content: space-between">
                        <h3 style="margin: 0">zerogpt.com</h3>
                        <span>
                            ${getLevel(result.fake_score / 100)}
                        </span>
                    </div>
                    <hr style="width: 100%">

                    <div style="
                        background: linear-gradient(to right, var(--ai-highlight) ${result.fake_score}%, transparent ${result.fake_score}%) no-repeat;
                        background-color: var(--main-shadow-color);
                        width: calc(100% - 10px);
                        font-size: 10px;
                        font-weight: bold;
                        padding: 4px 6px;
                        display: flex;
                        gap: 2px;
                    ">
                        <span style="min-width: 22px; display: block;">${Math.round(result.fake_score)}%</span> / ROBOT
                    </div>

                    <div style="
                        background: linear-gradient(to right, var(--human-highlight) ${result.human_score}%, transparent ${result.human_score}%) no-repeat;
                        background-color: var(--main-shadow-color);
                        width: calc(100% - 10px);
                        font-size: 10px;
                        font-weight: bold;
                        padding: 4px 6px;
                        display: flex;
                        gap: 2px;
                    ">
                        <span style="min-width: 22px; display: block;">${Math.round(result.human_score)}%</span> / HUMAN
                    </div>

                    <br style="margin-top: 4px;">

                    <i style="cursor: pointer; font-size: 10px;" id="zerogpt_text_switch" onclick="zerogpt_text.hidden=false; zerogpt_text_switch.hidden=true;">SHOW MARKED TEXT</i>
                    <h6 id="zerogpt_text" style="margin: 0" hidden>${marked_text}</h6>
                `
                break;
            case "radar":
                const models = ["DOLLY V2 3B", "CAMEL 5B", "DOLLY V1 6B", "VICUNA 7B"];
                const probs = {};
                let ai_median = 0;

                Object.entries(result.map((result) => result.results[0].p)).map(([index, prob]) => probs[models[index]] = prob);

                const sorted = Object.values(probs).sort();

                if (sorted.length % 2 === 0) {
                    ai_median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
                } else {
                    ai_median = sorted[Math.floor(sorted.length / 2)];
                }

                const level = getLevel(ai_median);

                let resultHTML = `
                    <div style="display: flex; justify-content: space-between">
                        <h3 style="margin: 0">radar models</h3>
                        <span>
                            ${level}
                        </span>
                    </div>
                    <hr style="width: 100%">
                    <div style="display: flex; justify-content: space-between;">
                        <small>MEDIAN AI % ${(ai_median * 100).toFixed(1)}</small>
                        <small>MEDIAN HUMAN % ${((1 - ai_median) * 100).toFixed(1)}</small>
                    </div>
                    <div style="border-radius: 6px; overflow: hidden; background: var(--main-shadow-color); margin-top: 10px">
                `;

                let modelIndex = 0;

                for (const score of Object.entries(probs).sort((a, b) => b[1] - a[1])) {
                    const model = score[0];
                    const prob = score[1];
                    resultHTML += `
                    <div style="
                        background: linear-gradient(to right, var(${(() => {
                            if (prob < 0.5) return "--human-highlight";
                            if (prob < 0.8) return "--mix-highlight";
                            return "--ai-highlight";
                        })()
                        }) ${prob * 100}%, transparent ${prob * 100}%) no-repeat;
                        width: calc(100% - 10px);
                        font-size: 10px;
                        font-weight: bold;
                        padding: 4px 6px;
                        display: flex;
                        gap: 2px;
                        ${modelIndex++ != Object.keys(probs).length - 1 ? "border-bottom: solid 1px var(--main-shadow-color);" : ""}
                    ">
                        <span style="min-width: 22px; display: block;">${Math.round(prob * 100)}%</span> / ${model}
                    </div>`
                }

                resultHTML += "</div>"

                resultDiv.innerHTML = resultHTML;
                break;

            default:
                resultDiv.innerHTML =
                    `
                    <h3 style="margin: 0">${key} response</h3>
                    ${JSON.stringify(result)}
                `
                break;
        }
        results.appendChild(resultDiv)
    }
    const resultDiv = document.createElement("div");
    resultDiv.classList.add("result")
    resultDiv.style.height = "100%"
    resultDiv.style.display = "flex"
    resultDiv.style.flexDirection = "column"
    sumbit.value = "Submit";
    sumbit.classList.remove("clicked")
    resultDiv.innerHTML = `Queried a total of ${Object.keys(query_results).length} sources`
    results.appendChild(resultDiv)
}

async function getDetectionResults(query_text) {
    const results = {}
    const query_array = splitTextIntoChunks(query_text, 200);

    results["radar"] = RADAR_AGGREGATE(query_text)

    results["gptzero"] = GPTZERO_VERDICT(query_text)
    results["zerogpt"] = ZEROGPT_VERDICT(query_text)

    results["seoai"] = SEOAI_VERDICT(query_text)

    results["gltr"] = gltr_VERDICT(query_text)
    results["roberta"] = ROBERTA_VERDICT(query_array)

    const keys = Object.keys(results);

    addLoader();

    for (const key of keys) {
        resultTitle.innerText = `Querying... ${key} (${keys.indexOf(key) + 1}/${keys.length})`
        results[key] = await (await results[key]).json()
    }


    const seoai = results["seoai"];

    results["roberta"] = {
        query_array: query_array,
        response: results["roberta"]
    }

    results["seoai"] = {
        "prediction": seoai.subScores[0],
        "entropy": seoai.subScores[1],
        "correlation": seoai.subScores[2],
        "perplexity": seoai.subScores[3],
        "mean": seoai.score,
    }

    return results;
}

function ZEROGPT_VERDICT(query_text) {
    return fetch(BASE_URL + "/zerogpt", {
        method: "POST",
        body: query_text
    })
}

function GPTZERO_VERDICT(query_text) {
    return fetch(BASE_URL + "/gptzero", {
        method: "POST",
        body: query_text
    })
}


function gltr_VERDICT(query_text) {
    return fetch(BASE_URL + "/gtlr_interp", {
        method: "POST",
        body: query_text
    })
}

function SEOAI_VERDICT(query_text) {
    return fetch("https://tools.seo.ai/api/ai-detection", {
        method: "POST",
        body: JSON.stringify({ "text": query_text }),

        headers: {
            "Content-Type": "application/json",
        },
    })
}

function ROBERTA_VERDICT(query_array) {
    return fetch("https://api-inference.huggingface.co/models/roberta-base-openai-detector", {
        method: "POST",
        body: JSON.stringify(query_array),
        headers: { "Authorization": "Bearer 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" }
    })
}

function RADAR_WRAPPER(query_text, index) {
    return fetch("https://radar-app.vizhub.ai/api/checkTexts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model_index: index,
            texts: [query_text]
        })
    });
}

function DOLLY_V2_3B_VERDICT(query_text) {
    return RADAR_WRAPPER(query_text, 0);
}

function CAMEL_5B_VERDICT(query_text) {
    return RADAR_WRAPPER(query_text, 1);
}

function DOLLY_V1_6B_VERDICT(query_text) {
    return RADAR_WRAPPER(query_text, 2);
}

function VICUNA_7B_VERDICT(query_text) {
    return RADAR_WRAPPER(query_text, 3);
}

async function RADAR_AGGREGATE(query_text) {
    const results = await Promise.all([
        DOLLY_V2_3B_VERDICT(query_text),
        CAMEL_5B_VERDICT(query_text),
        DOLLY_V1_6B_VERDICT(query_text),
        VICUNA_7B_VERDICT(query_text)
    ]);

    return {
        json: async () => {
            const jsonResults = await Promise.all(results.map(result => result.json()));
            return jsonResults;
        }
    };
}

function splitTextIntoChunks(text, maxChunkSize) {
    const sentences = text.split(/[.!?]/);

    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if (currentChunk.split(' ').length + sentence.split(' ').length <= maxChunkSize) {
            currentChunk += sentence + '.';
        } else {
            chunks.push(currentChunk);
            currentChunk = sentence + '.';
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

sumbit.addEventListener("click", (event) => {
    perform_query(query_content.value)
});

query_text_elm.addEventListener("keydown", (event) => {
    if (event.which === 13 && !event.shiftKey) {
        perform_query(query_content.value)
        event.preventDefault();
    }
});

query_text_elm.addEventListener("keyup", () => {
    updateKeyup();
});

setInterval(updateTextInfo, 50)

function updateTextInfo() {
    const characters = document.getElementById("query-info-characters");
    const words = document.getElementById("query-info-words");
    const sentences = document.getElementById("query-info-sentences");

    characters.innerText = "Characters " + query_content.value.length
    words.innerText = "Words " + Math.min(query_content.value.length, query_content.value.split(" ").length);

    const result = query_content.value.match(/[^\.!\?]+[\.!\?]+/g);
    if (result != null)
        sentences.innerText = "Sentences " + (query_content.value.match(/[^\.!\?]+[\.!\?]+/g).length)
    else
        sentences.innerText = "Sentences " + Math.min(query_content.value.length, query_content.value.split(".").length);
}

function updateKeyup() {
    updateTextInfo()
}

updateKeyup();