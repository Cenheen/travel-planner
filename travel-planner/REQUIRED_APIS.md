# 必备 API 申请指南

为了让您的旅行规划助手正常工作，您需要申请以下 API 密钥。

## 1. OpenAI API (核心必备)
这是生成智能行程规划的“大脑”。没有它，应用无法生成任何内容。

*   **用途**: 理解用户需求，生成详细的每日行程 JSON 数据。
*   **申请地址**: [https://platform.openai.com/](https://platform.openai.com/)
*   **成本**: 按量付费 (每生成一次行程约 $0.01 - $0.03)。需要绑定国际信用卡。
*   **替代方案**: 如果您在国内无法直接使用 OpenAI，可以考虑申请 **阿里云通义千问** 或 **百度文心一言** 的 API，但需要修改后端代码的调用逻辑。

## 2. Unsplash API (强烈推荐)
这是让应用看起来“高端”的关键。

*   **用途**: 根据目的地自动获取高清、精美的背景图片。
*   **申请地址**: [https://unsplash.com/developers](https://unsplash.com/developers)
*   **成本**: **免费** (Demo 模式下每小时 50 次请求，对个人使用足够)。
*   **设置**: 
    1. 注册账号并创建一个 "New Application"。
    2. 获取 `Access Key`。
    3. 在应用中输入此 Key。

---

## 暂时不需要的 API (Nice to have)
目前的版本**不需要**以下 API 也能完美运行，但未来可以考虑接入：

*   **Google Maps / Mapbox**: 用于在地图上显示路线点。目前我们只用文字描述。
*   **Skyscanner / Amadeus**: 用于查询实时机票价格。目前 AI 只是给出“建议”，不涉及真实订票。
*   **OpenWeather**: 用于显示当地天气。
