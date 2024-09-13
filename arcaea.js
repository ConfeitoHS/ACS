(async function () {

    const SHEET_ID = "1aUhG8C-0wVsL_jMPwpkZ4hXMH5zN9sZDM_wGBb4On0w";
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




    const timeConverter = (timestamp) => {
        var a = new Date(timestamp);
        const pad = (num) => { if (num < 10) { return '0' + num.toString(); } else { return num.toString(); } };
        var year = a.getFullYear();
        var month = a.getMonth()+1;
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = year + '/' + pad(month) + '/' + pad(date) + ' ' + pad(hour) + ':' + pad(min) + ':' + pad(sec);
        return time;
    }
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

    const getSheet = async (sheet) => {
        try {
            const sheet_html = await fetchHTML(`https://docs.google.com/spreadsheets/d/${sheet}/htmlview`);
            let sheet_dom = new DOMParser().parseFromString(sheet_html, 'text/html');
            const res = [];
            const scores = [];
            let last_update = parseInt(sheet_dom.querySelector(`[id^='${674481593}R2']+td+td+td+td+td`).textContent);
            if (isNaN(last_update)) {
                last_update = 0;
            }
            if(last_update<1e12){
                last_update =  last_update*1000;
            }

            sheet_dom.querySelectorAll(`[id^='${SHEET_GID}R']:not([id$=R0]):not([id$=R1]):not([id$=R2]):not([id$=R3])+td`).forEach((x) => { const key = x.textContent + '_' + x.nextSibling.textContent; res.push(key); scores.push([key, parseInt(x.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.textContent.replaceAll(',', ''))]); });
            const title = sheet_dom.title;
            const ver = title.match(/v\d*.\d*\.?\d*\w?/)[0]
            console.log(res)
            return [ver, last_update, res, new Map(scores)];
        }
        catch (e) {
            return [null, null, null, null];
        }

    }
    const getSubscrTS = async () => {
        return (await fetchURL(BASE_URL + ME_PATH))["value"]["arcaea_online_expire_ts"] > 0;
    };

    const getScoreData = async (difficulty, page) => {
        return fetchURL(BASE_URL + SCORE_PATH + "?difficulty=" + difficulty + "&page=" + page + "&sort=date&term=");
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
    let MY_ID = window.prompt('사용하고 계신 시트의 ID를 입력해주세요(링크 공유 필수). 기본적으로는 빈 시트의 ID가 입력되어있습니다.', SHEET_ID);
    if (MY_ID == null) return;
    const [sheetVer, lastUpdateTS, sheetNames, sheetScores] = await getSheet(MY_ID);
    if (sheetVer == null) {
        window.alert('시트 불러오기 실패');
        return;
    }
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
    let totalpages = pagesall.reduce((x, y) => (x + y), 0);
    const totalscores = totaldiff.reduce((x, y) => (x + y), 0);

    let namedLastUp = '동기화 기록 없음.'
    if (lastUpdateTS != 0) {
        namedLastUp = '마지막 동기화: ' + timeConverter(lastUpdateTS);
    }

    //for (let i = 0; i < alldiff; i++) { scoredata.push([]); }
    if (window.confirm(namedLastUp + '\n' + totaldiff.map((x, i) => (diffnames[i] + ' ' + x)).join(' + ') + ' = ' + totalscores + '개' + "\n\n플레이한 채보가 많으면 시간이 오래 걸릴 수 있습니다. 확인을 누르면 Arcaea Online으로부터 스코어 데이터를 가져옵니다.")) {

        const top = document.querySelector("section.player-site-content");

        const infoBG = document.createElement("div");
        const hexaFore = document.createElement("div");
        const hexaBack = document.createElement("div");

        const infoText = document.createElement("span");
        const progText = document.createElement("span");
        const finalText = document.createElement("span");

        hexaFore.appendChild(infoText);
        hexaFore.appendChild(progText);
        hexaFore.appendChild(finalText);
        infoBG.appendChild(hexaFore);
        infoBG.appendChild(hexaBack);
        top.appendChild(infoBG);

        var styleElem = document.head.appendChild(document.createElement("style"));

        infoBG.style.position = "absolute";
        infoBG.style.top = "0";
        infoBG.style.zIndex = "10000";
        infoBG.style.width = "100%";
        infoBG.style.height = "100%";
        infoBG.style.backgroundColor = "rgba(0, 0, 0, 0.5)";


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


        //let _mtop = `${-Math.round(Math.min(window.innerWidth, 600) * 0.256) / 2}px`;
        hexaFore.className = 'myhexagon';
        hexaFore.style.backgroundColor = "#f8f8f9";
        hexaFore.style.zIndex = 4;
        hexaFore.style.marginTop = "max(-12.8vw, -77px)";
        hexaFore.style.top = "32.8vh";

        hexaBack.className = 'myhexagon';
        hexaBack.style.top = "33.8vh";
        hexaBack.style.marginTop = "max(-12.8vw, -77px)";
        hexaBack.style.zIndex = 2;
        hexaBack.style.backgroundColor = "#d8d8d9";

        infoText.textContent = "데이터 수집중";
        infoText.style.fontSize = 'min(24px,4vw)';
        infoText.style.fontWeight = 'bold';
        progText.style.fontSize = 'min(18px,3vw)';
        progText.style.textAlign = 'center';
        finalText.style.fontSize = 'min(12px,2vw)';
        finalText.style.width = '80%';
        finalText.style.textAlign = 'center';



        let currentpage = 0;
        const updateStartTS = Math.round(Date.now()/1000);
        try {
            let lasttime = Date.now();
            let meaninterval = 0;
            const scoreList = [];
            for (let k = 0; k < alldiff; k++) {
                for (let p = 1; p <= pagesall[k]; p++) {
                    const scoredata = await getScoreData(k, p);
                    if (!scoredata["success"]) {
                        throw new Error("스코어를 가져오는 데에 실패했습니다.");
                    }
                    let flag = false;
                    for (entry of scoredata["value"]["scores"]) {
                        if (entry['time_played'] < lastUpdateTS) {
                            flag = true;
                            break;
                        }
                        scoreList.push(basicMapper(entry));

                    }


                    currentpage++;
                    await _sleep(getRandomInt(600, 1100));
                    let interval = Date.now() - lasttime;
                    lasttime = Date.now();
                    meaninterval = meaninterval + (interval - meaninterval) / currentpage;
                    progText.innerHTML = `${currentpage} / ${totalpages}<br>`;
                    if (currentpage > 5) {
                        progText.innerHTML += `${(Math.round((totalpages - currentpage) * meaninterval / 1000)).toString()}초 남음`;
                    }
                    if (flag) {
                        //stop update
                        progText.innerHTML = `과거에 업데이트 기록이 있습니다.<br>스킵합니다.`;
                        totalpages -= (pagesall[k] - p);
                        break;
                    }
                }
            }
            console.log('scores collected, converting start');
            const finalResult = ['','',updateStartTS, '점수'];
            const scoreMap = new Map(scoreList);
            for (idx = 0; idx < sheetNames.length; idx++) {
                if (scoreMap.has(sheetNames[idx])) {
                    finalResult.push(scoreMap.get(sheetNames[idx]));
                } else if (sheetScores.has(sheetNames[idx])) {
                    finalResult.push(sheetScores.get(sheetNames[idx]));
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
                but.style.backgroundColor = "#a3edff";
                but.style.color = "#1c1c1c"
            }

            copybutton.id = 'lastcopybutton';
            copybutton.style.cssText = "width: 30%;clip-path: polygon(16.6% 0%,83.4% 0%,100% 50%,83.4% 100%,16.6% 100%,0% 50%);aspect-ratio: 3/1;z-index: 10001;top: 50vh;left: 35%;position: absolute;background-color: lavender;box-shadow: 5px 5px black;font-size: min(18px,3vw); font-weight: bold;";
            copybutton.textContent = "복사하기";
            copybutton.onclick = buttonclick;
            infoBG.append(copybutton);

            infoText.textContent = scoreList.length + '개의 기록이 수집되었습니다.';
            progText.textContent = '';
            finalText.innerHTML = "1. 아래 버튼을 눌러 결과 복사<br>2. 컨설턴트 시트의 필터를 모두 해제<br>3. 업뎃 순으로 오름차순 정렬<br>4. G열을 클릭하고 붙여넣기";

            //window.alert(scoreList.length + '개의 기록이 수집되었습니다.' + "결과가 클립보드에 복사되었습니다. 컨설턴트 시트의 1.필터를 모두 해제하고 2.업뎃 순으로 오름차순 정렬한 후 3.Sayonara Hatsukoi FTR의 점수 기입칸에 붙여넣으세요.");

        } catch (e) {
            console.error('Error: ', e);
            window.alert("에러가 발생했습니다.");
            return;
        }
    }
})();
