import OpenAI from 'openai';

const getObjectFromLocalStorage = async function (key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(key, function (value) {
                resolve(value[key]);
            });
        } catch (ex) {
            reject(ex);
        }
    });
};

const saveObjectInLocalStorage = async function(obj) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(obj, function() {
          resolve();
        });
      } catch (ex) {
        reject(ex);
      }
    });
  };

let api_key = await getObjectFromLocalStorage("apiKey");
console.log("api_key", api_key)
const openai = new OpenAI({ apiKey: api_key, dangerouslyAllowBrowser: true });

async function sendPageContent() {

    const textContent = document.body.innerText;
    let text = window.location.href + '\n' + textContent.substring(0, 2000);

    let prompt = `
    You are a parental control app, designed to protect children (of age 2-13) from inappropriate content.
    It's obvious what content should be blocked: violence, sexual, hateful, social networks, criminal activity, 
    crimes, war crimes, atrocities, medical, drugs, explicit content, pornography, misinformation, pseudoscience etc...
    Anything that would disturb a child. Please err on the safe side!
    Should a web page with following url and content be blocked? answer only YES or NO, followed with a newline and a brief explanation.
    ===
    ` + text;

    console.log('prompt:', prompt);

    let model = await getObjectFromLocalStorage("model");

    console.log("use model", model);

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: model,
        // model: 'gpt-3.5-turbo',        
    });

    let a = completion.choices[0].message.content;
    let info = a.split('\n').slice(1).join('\n');
    let do_block = a.includes("YES");

    console.log("chat response:", a, info, a.split('\n'));

    saveObjectInLocalStorage({
        [window.location.href]: {
                href: window.location.href,
                decision: do_block,
                info: info.trim() 
            }
        });

    console.log("block?", do_block);

    if (do_block) {
        blockPage(info, window.location.href);
    } else {
        document.getElementById("hide_overlay_012345").style.display = "none";
    }
}

function blockPage(info, href) {
    window.stop()
    document.querySelector('head').innerHTML = "";
    document.querySelector('body').innerHTML = `
    <div>
        <h1>This page was blocked by a content filter</h1>
        <h3>${href}, reason for the block:</h3>
        <p>${info}<\p>
    </div>
    `
}

function hidePage() {

    var div = document.createElement("div");
    div.id = "hide_overlay_012345";
    div.style.position = "fixed";

    div.style.width = "100%";
    div.style.height = "100%";
    div.style.backgroundColor = "rgba(255,255,255,1)";

    div.style.top = "0";
    div.style.left = "0";
    div.style.right = "0";
    div.style.bottom = "0";
    div.style.zIndex = "1000000";

    div.style.textAlign = "center";
    div.style.paddingTop = "50px";
    div.style.fontFamily = "sans-serif";
    div.style.fontSize = "24px";
    
    div.innerHTML = "Validating page content...";
    document.body.prepend(div);
}

let cached = await getObjectFromLocalStorage(window.location.href);
console.log("check cached", cached);

if (cached) {

    if (cached.decision) {
        blockPage(cached.info, cached.href);
    }

} else {

    hidePage();

    if (document.readyState === 'complete') {
        // If the page is already loaded, send the message immediately
        console.log('Page is already loaded, sending message immediately')
        sendPageContent();
    } else {
        console.log('Page is not loaded, waiting for load event')
        window.addEventListener('load', sendPageContent);
    }
}