module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { mid, key, page = 1 } = req.query;
    const customHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/504.1',
        'Referer': 'https://m.kuwo.cn/',
    };

    try {
        // 逻辑A：如果是搜索
        if (key) {
            const searchUrl = `https://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(key)}&pn=${page}&rn=20&uid=794&ver=kwplayer_ar_9.2.2.1&vipver=1&show_theme=0&newver=1&encoding=utf8&rformat=json`;
            const response = await fetch(searchUrl, { headers: customHeaders });
            const rawText = await response.text();
            const cleanJsonText = rawText.replace(/'/g, '"');
            const searchData = JSON.parse(cleanJsonText);

            const list = (searchData.abslist || []).map(item => ({
                mid: item.MUSICRID.replace('MUSIC_', ''),
                name: item.SONGNAME,
                artist: item.ARTIST,
                album: item.ALBUM
            }));
            return res.status(200).json({ code: 200, data: list });
        }

        // 逻辑B：如果是获取直链（加入了针对2026浏览器的https强转黑科技）
        if (mid) {
            const targetUrl = `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${mid}&format=mp3&response=url`;
            const response = await fetch(targetUrl, { headers: { ...customHeaders, 'Host': 'antiserver.kuwo.cn' } });
            const audioUrl = await response.text();

            if (audioUrl && audioUrl.startsWith('http')) {
                // 【核心修复】：强行把酷我的 http:// 替换成安全加密的 https:// 绕过浏览器拦截
                const safeAudioUrl = audioUrl.trim().replace('http://', 'https://');
                
                return res.status(200).json({ code: 200, audio_url: safeAudioUrl });
            } else {
                return res.status(404).json({ code: 404, msg: "未获得有效音频流" });
            }
        }

        return res.status(400).json({ code: 400, msg: "缺少必要参数！" });

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "服务器发生错误", error: error.message });
    }
};
