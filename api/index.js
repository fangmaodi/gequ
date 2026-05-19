// api/index.js
// 引入 Vercel 自带的 fetch 库
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 开启全网跨域（确保你的 TVBox、手机 App 或本地网页能直接调用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 获取用户传过来的歌曲输入参数（比如通过 url?mid=123456 调取）
    const { mid } = req.query;

    if (!mid) {
        return res.status(400).json({ status: 400, msg: "缺少 mid 歌曲参数！" });
    }

    try {
        // 核心：酷我官方的最新高音质直链解析源地址
        const targetUrl = `http://www.kuwo.cn/api/v1/mp3/link?mid=${mid}&type=music&bitrate=320k&response=url`;

        // 关键黑科技：在 Vercel 后台完美伪装成酷我官网的请求头，彻底绕过封锁
        const customHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'http://www.kuwo.cn/',
            'csrf': 'HM9Z147X7BG', // 酷我必检查的内部随机鉴权标志
            'Cookie': 'kw_token=HM9Z147X7BG' // 保持和 csrf 一致
        };

        // Vercel 替你出面，前去抓取酷我的源数据
        const response = await fetch(targetUrl, { headers: customHeaders });
        const data = await response.json();

        // 过滤并包装原作者/官方的源，吐出精简干净的全新定制接口
        if (data && data.code === 200 && data.data && data.data.url) {
            return res.status(200).json({
                status: "success",
                code: 200,
                service: "我的酷我专属 API 面板",
                music_id: mid,
                audio_url: data.data.url, // 这一行就是可以直接播放的 mp3 真实直链
                tips: "此接口托管于 Vercel Serverless，永久免费运行"
            });
        } else {
            return res.status(404).json({ code: 404, msg: "没能从酷我提取到该歌曲的有效直链" });
        }

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "Vercel 中转失败，原源接口可能发生变动", error: error.message });
    }
};
