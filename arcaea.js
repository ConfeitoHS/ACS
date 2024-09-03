(async function () {

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1aUhG8C-0wVsL_jMPwpkZ4hXMH5zN9sZDM_wGBb4On0w/htmlview";
    const SHEET_GID = "674481593";
    const BASE_URL = "https://webapi.lowiro.com/webapi/";
    const ME_PATH = "user/me";
    const SCORE_PATH = "score/song/me/all";
    const diffnames = ["PST", "PRS", "FTR|ETR", "BYD"];
    const diffunits = ["PST", "PRS", "FTR", "BYD", "ETR"];
    const lut = { "PST": 0, "PRS": 1, "FTR": 2, "ETR": 2, "BYD": 3 };
    const multi_names = {
        "quonwacca": "Quon(WACCA)",
        "quon": "Quon(Lanota)",
        "genesischunithm": "Genesis(CHUNITHM)",
        "genesis": "Genesis(Arcaea)",
        "ii": "II",
        "neokosmo": "neo kosmo",
    };
    const alldiff = 4;

    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min) + min);
    const basicMapper = (entry) => {
        let songkey = "";
        if (entry["song_id"] in multi_names) {
            songkey = multi_names[entry["song_id"]];
        }
        else {
            songkey = entry["title"]["en"];
        }
        return [songkey + '_' + diffunits[entry["difficulty"]], entry["score"]];
    };

    const fetchURL = async (url) => {
        const response = await fetch(url, { cache: "no-store", credentials: "include" });
        if (!response.ok) {
            throw new Error(`네트워크 오류: ${response.statusText}`);
        }
        return response.json();
    };
    const fetchHTML = async (url) => {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`네트워크 오류: ${response.statusText}`);
        }
        return response.text();
    };

    const getSheet = async () => {
        const sheet_html = await fetchHTML(SHEET_URL);
        let sheet_dom = new DOMParser().parseFromString(sheet_html, 'text/html');
        const res = [];
        sheet_dom.querySelectorAll(`[id^='${SHEET_GID}R']:not([id$=R0]):not([id$=R1])+td`).forEach((x) => { res.push(x.textContent + '_' + x.nextSibling.textContent) });
        const title = sheet_dom.title;
        const ver = title.match(/v\d*.\d*\.?\d*\w?/)[0]
        console.log(res)
        return [ver, res];
    }
    const getSubscrTS = async () => {
        return (await fetchURL(BASE_URL + ME_PATH))["value"]["arcaea_online_expire_ts"] > 0;
    };

    const getScoreData = async (difficulty, page) => {
        return fetchURL(BASE_URL + SCORE_PATH + "?difficulty=" + difficulty + "&page=" + page + "&sort=title");
    };

    const processFlag = location.href.match(/\/\/arcaea.lowiro.com\/[a-z]{2}\/profile(|\/|\/.*)(\?.*)?$/);
    if (!processFlag) {
        if (window.confirm('Arcaea Online에 로그인하여 북마클릿을 실행해 주세요.')) {
            location.href = 'https://arcaea.lowiro.com/profile';
        }
        return;
    }
    if (!(await getSubscrTS())) {
        if (window.confirm('Arcaea Online에 구독중이 아닙니다. 구독 후 사용해 주세요.')) { }
        return;
    }

    const [sheetVer, sheetNames] = await getSheet();
    console.log("Neul's Sheet 불러오기 성공")
    console.log(sheetVer)
    const totaldiff = [];
    const pagesall = [];
    try {
        for (let k = 0; k < alldiff; k++) {
            const dat = await getScoreData(k, 1);
            const chartcount = dat["value"]["count"];
            totaldiff.push(chartcount);
            pagesall.push(Math.ceil(chartcount * 0.1));
        }

    } catch (e) {
        console.error('Error: ', e);
        window.alert("에러가 발생했습니다.");
        return;
    }
    const totalpages = pagesall.reduce((x, y) => (x + y), 0);
    const totalscores = totaldiff.reduce((x, y) => (x + y), 0);

    //for (let i = 0; i < alldiff; i++) { scoredata.push([]); }
    if (window.confirm("본 스크립트는 컨설턴트 시트 " + sheetVer + "에서만 작동합니다. 사용하고 계신 시트의 버전이 이와 맞지 않는 경우, 시트를 미리 업데이트 해 주세요.\n\n" + totaldiff.map((x, i) => (diffnames[i] + ' ' + x)).join(' + ') + ' = ' + totalscores + '개' + "\n\n플레이한 채보가 많으면 시간이 오래 걸릴 수 있습니다. 확인을 누르면 Arcaea Online으로부터 스코어 데이터를 가져옵니다.")) {
        const top = document.querySelector("section.player-site-content")
        const toolBg = document.createElement("div");

        toolBg.style.position = "absolute";
        toolBg.style.top = "0";
        toolBg.style.zIndex = "10000";
        toolBg.style.width = "100%";
        toolBg.style.height = "100%";
        toolBg.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

        const infoArea = document.createElement("div");
        const infoArea2 = document.createElement("div");

        infoArea.className = 'myhexagon';
        infoArea.style.backgroundColor = "#f8f8f9";
        infoArea.style.zIndex = 4;
        infoArea.style.marginTop = "-77px";
        infoArea.style.top = "32.8vh";

        infoArea2.className = 'myhexagon';
        infoArea2.style.top = "33.8vh";
        infoArea2.style.marginTop = "-77px";
        infoArea2.style.zIndex = 2;
        infoArea2.style.backgroundColor = "#d8d8d9";
        var styleElem = document.head.appendChild(document.createElement("style"));

        styleElem.innerHTML = `.myhexagon{aspect-ratio:3/1;
            position:absolute;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            margin:0 auto;
            width:76.8%;
            left:11.6%;
            color:#000;
            clip-path:polygon(16.6% 0%,83.4% 0%,100% 50%,83.4% 100%,16.6% 100%,0% 50%)}`;

        const infoSpan = document.createElement("span");
        const numberSpan = document.createElement("span");
        const lastPara = document.createElement("span");
        infoSpan.textContent = "데이터 수집중";
        infoSpan.style.fontSize = '1.5rem';
        numberSpan.style.fontSize = '1rem';
        lastPara.style.fontSize = '0.9rem';
        lastPara.style.width = '75%';
        lastPara.style.textAlign = 'center';

        infoArea.appendChild(infoSpan);
        infoArea.appendChild(numberSpan);
        infoArea.appendChild(lastPara);
        toolBg.appendChild(infoArea);
        toolBg.appendChild(infoArea2);
        top.appendChild(toolBg);

        let currentpage = 0;

        try {
            const scoreList = [];
            for (let k = 0; k < alldiff; k++) {
                for (let p = 1; p <= pagesall[k]; p++) {
                    const scoredata = await getScoreData(k, p);
                    if (!scoredata["success"]) {
                        throw new Error("스코어를 가져오는 데에 실패했습니다.");
                    }
                    scoreList.push(...(scoredata["value"]["scores"].map(basicMapper)));

                    currentpage++;
                    numberSpan.textContent = `${currentpage} / ${totalpages}`;
                    await _sleep(getRandomInt(300, 600));
                }
            }
            console.log('scores collected, converting start');
            const finalResult = [];
            const scoreMap = new Map(scoreList);
            for (idx = 0; idx < sheetNames.length; idx++) {
                if (scoreMap.has(sheetNames[idx])) {
                    finalResult.push(scoreMap.get(sheetNames[idx]));
                } else {
                    finalResult.push(0);
                }

            }
            const copybutton = document.createElement('button');
            const buttonclick = async () => {
                const but = document.getElementById('lastcopybutton');
                try {
                    await window.navigator.clipboard.writeText(finalResult.join("\n"));
                } catch (e) {
                    but.innerText = "복사 실패!"
                    but.style.backgroundColor = "lightcoral";
                    but.style.color = "floralwhite";

                    return
                }
                but.innerText = "복사됨!"
                but.style.backgroundColor = "lightskyblue";
                but.style.color = "midnightblue"
            }
            copybutton.id = 'lastcopybutton';
            copybutton.style.cssText = "width: 30%;clip-path: polygon(16.6% 0%,83.4% 0%,100% 50%,83.4% 100%,16.6% 100%,0% 50%);aspect-ratio: 3/1;z-index: 10001;top: 50vh;left: 35%;position: absolute;background-color: lavender;border-width: 3px 0px;box-shadow: 5px 5px black;font-size: 1.2rem; font-weight: bold;";
            copybutton.textContent = "복사하기";
            copybutton.onclick = buttonclick;
            toolBg.append(copybutton);

            infoSpan.textContent = scoreList.length + '개의 기록이 수집되었습니다.';
            numberSpan.textContent = '';
            lastPara.innerHTML = "1. 아래 버튼을 눌러 결과 복사<br>2. 컨설턴트 시트의 필터를 모두 해제<br>3. 업뎃 순으로 오름차순 정렬<br>4. Sayonara Hatsukoi FTR의 점수 기입칸에 붙여넣기";

            //window.alert(scoreList.length + '개의 기록이 수집되었습니다.' + "결과가 클립보드에 복사되었습니다. 컨설턴트 시트의 1.필터를 모두 해제하고 2.업뎃 순으로 오름차순 정렬한 후 3.Sayonara Hatsukoi FTR의 점수 기입칸에 붙여넣으세요.");

        } catch (e) {
            console.error('Error: ', e);
            window.alert("에러가 발생했습니다.");
            return;
        }
    }
})();