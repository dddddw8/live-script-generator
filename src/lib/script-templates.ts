export const SCRIPT_STRUCTURE = {
  name: "直播话术标准结构",
  description: "基于实战验证的「痛点→背书→卖点→促单」话术闭环",
  sections: [
    {
      id: "opening",
      name: "开场痛点",
      description: "用痛点场景吸引目标用户停留，点名人群，制造共鸣",
      prompt_hint: "描述目标用户的痛点场景，用提问或场景描述引起共鸣，让用户觉得'说的就是我'",
    },
    {
      id: "brand",
      name: "品牌背书 + 引出产品",
      description: "用品牌实力、资质、口碑建立信任，自然过渡到产品",
      prompt_hint: "介绍品牌优势（教育基因/科技实力/权威认证/用户口碑），然后自然引出今天推荐的产品",
    },
    {
      id: "selling_points",
      name: "主卖点展示 + 竞品对比",
      description: "逐一展示核心卖点，穿插与竞品的对比，突出差异化优势",
      prompt_hint: "结构化展示3-5个核心卖点，每个卖点要有具体数据/场景/对比，让用户感受到产品的实际价值",
    },
    {
      id: "first_close",
      name: "首次促单 + 售后保障",
      description: "第一次促单，强调价格优势和售后保障消除顾虑",
      prompt_hint: "报价格、讲优惠、说赠品、强调售后（7天无理由、包邮等），制造紧迫感促进下单",
    },
    {
      id: "emotion",
      name: "感情升华 + 应用场景",
      description: "从功能价值升华到情感价值，描绘使用场景",
      prompt_hint: "描述产品带来的长期价值和情感收获，用生活场景让用户产生画面感和向往",
    },
    {
      id: "second_close",
      name: "二次促单 + 收尾",
      description: "再次强调核心利益点，最后一波促单",
      prompt_hint: "总结核心卖点和优惠，再次制造紧迫感，引导立即下单，简洁有力地收尾",
    },
  ],
};

export const STYLE_OPTIONS = [
  {
    id: "knowledge",
    name: "知识科普型",
    description: "侧重产品知识讲解，用专业内容建立信任",
    icon: "BookOpen",
  },
  {
    id: "emotion",
    name: "情感共鸣型",
    description: "侧重场景描绘和情感连接，打动用户内心",
    icon: "Heart",
  },
  {
    id: "promotion",
    name: "促销逼单型",
    description: "侧重价格优势和紧迫感，快速促进转化",
    icon: "Zap",
  },
];

export const WORD_COUNT_OPTIONS = [
  { value: 800, label: "800字", description: "约3-5分钟", recommended_for: "引流款/低客单价" },
  { value: 1500, label: "1500字", description: "约5-8分钟", recommended_for: "主推款/中客单价" },
  { value: 3000, label: "3000字", description: "约8-12分钟", recommended_for: "利润款/高客单价" },
];

export const LOOP_TIME_OPTIONS = [
  { value: 5, label: "5分钟", description: "快节奏循环" },
  { value: 8, label: "8分钟", description: "标准节奏（推荐）" },
  { value: 10, label: "10分钟", description: "深度讲解" },
];

export const CATEGORY_TEMPLATES = [
  {
    id: "children_edu",
    name: "儿童教育产品",
    icon: "GraduationCap",
    default_info: "产品类型：儿童教育/启蒙产品\n目标人群：3-12岁孩子的家长\n核心诉求：科学启蒙、能力培养、寓教于乐",
  },
  {
    id: "beauty",
    name: "美妆护肤",
    icon: "Sparkles",
    default_info: "产品类型：美妆/护肤产品\n目标人群：18-45岁女性\n核心诉求：肌肤改善、变美、性价比",
  },
  {
    id: "food",
    name: "食品饮料",
    icon: "UtensilsCrossed",
    default_info: "产品类型：食品/饮料/零食\n目标人群：全年龄段\n核心诉求：好吃、健康、实惠",
  },
  {
    id: "digital",
    name: "3C数码",
    icon: "Smartphone",
    default_info: "产品类型：电子产品/数码配件\n目标人群：科技爱好者/年轻人\n核心诉求：性能、体验、性价比",
  },
  {
    id: "home",
    name: "家居生活",
    icon: "Home",
    default_info: "产品类型：家居/生活用品\n目标人群：家庭用户\n核心诉求：实用、品质、提升生活质量",
  },
  {
    id: "custom",
    name: "自定义",
    icon: "PenTool",
    default_info: "",
  },
];
