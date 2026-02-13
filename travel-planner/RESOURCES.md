# 旅行规划应用 API 资源指南

为了让您的旅行规划应用（Travel Planner）从“原型”变为“实战应用”，以下是您可以接入的真实 API 资源列表。

## 1. 🤖 AI 智能规划 (核心大脑)
用于生成个性化行程、推荐理由和旅行贴士。

*   **OpenAI API (GPT-4 / GPT-3.5)**
    *   **网址**: [platform.openai.com](https://platform.openai.com/)
    *   **用途**: 最强大的通用文本生成，适合生成完整的行程安排。
    *   **费用**: 按 Token (字数) 付费，新账号通常有免费额度。
*   **Anthropic Claude API**
    *   **网址**: [console.anthropic.com](https://console.anthropic.com/)
    *   **用途**: 文本生成质量极高，生成的文案通常更具“人情味”。
*   **Google Gemini API**
    *   **网址**: [ai.google.dev](https://ai.google.dev/)
    *   **用途**: Google 的最新模型，部分版本免费。

## 2. ✈️ 交通与住宿 (硬数据)
用于获取真实的航班时刻、价格和酒店空房情况。

*   **Amadeus for Developers** (首选推荐 🌟)
    *   **网址**: [developers.amadeus.com](https://developers.amadeus.com/)
    *   **用途**: 全球最大的旅游技术提供商之一。提供航班搜索、酒店预订、目的地景点推荐等。
    *   **优势**: 有非常友好的 "Self-Service" 免费沙盒环境，特别适合个人开发者。
*   **Skyscanner API (via RapidAPI)**
    *   **网址**: [rapidapi.com/skyscanner](https://rapidapi.com/collection/skyscanner-api-alternatives)
    *   **用途**: 航班比价数据。
*   **Booking.com API (via RapidAPI)**
    *   **网址**: [rapidapi.com/booking-com](https://rapidapi.com/tipsters/api/booking-com)
    *   **用途**: 酒店搜索、价格查询。

## 3. 🗺️ 地图与位置 (可视化)
用于在地图上显示路线、计算距离和展示街景。

*   **Google Maps Platform**
    *   **网址**: [developers.google.com/maps](https://developers.google.com/maps)
    *   **用途**: 业界标准。地点搜索 (Places API)、路线规划 (Directions API)、静态地图。
    *   **费用**: 每月有 $200 免费额度，对个人项目通常足够。
*   **Mapbox**
    *   **网址**: [mapbox.com](https://www.mapbox.com/)
    *   **用途**: 视觉效果非常酷炫的地图，适合做“高端”风格的定制地图。
    *   **优势**: 免费额度很大。

## 4. ☀️ 天气 (实用信息)
*   **OpenWeatherMap**
    *   **网址**: [openweathermap.org](https://openweathermap.org/api)
    *   **用途**: 获取目的地历史天气或未来天气预报。
    *   **优势**: 免费版支持当前天气和简单预报。

## 5. 🔍 哪里可以找到更多 API？
如果您想探索更多有趣的功能（比如汇率转换、签证信息等），可以去这些“API 超市”逛逛：

*   **RapidAPI** (全球最大的 API 市场)
    *   [rapidapi.com](https://rapidapi.com/)
    *   在这里搜索 "Travel", "Flight", "Currency" 可以找到成千上万个接口，很多都提供免费试用。
*   **Public APIs (GitHub)**
    *   [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis)
    *   一个由开发者维护的免费 API 列表，完全开源免费。

---

### 如何在项目中使用？
通常您需要注册账号 -> 获取 `API Key` -> 在代码中像我们调用 OpenAI 那样发送请求。
**注意安全**：永远不要把包含余额的 API Key 直接提交到 GitHub 公开仓库中！
