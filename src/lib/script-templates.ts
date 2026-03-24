export const SCRIPT_STRUCTURE = {
  name: "直播话术标准结构",
  description: "基于实战验证的话术闭环，融合 AIDA 模型与 FABE 卖点原则",
  sections: [
    {
      id: "opening",
      name: "开场痛点（Attention）",
      description: "用痛点场景吸引目标用户停留，点名人群，制造共鸣。对应 AIDA 的 Attention 阶段。",
      prompt_hint: "用场景话术描述目标用户的痛点，如'你的孩子是不是每天十万个为什么？'。用提问或场景描述引起共鸣，让用户觉得'说的就是我'。同时加入停留话术（预告福利/抽奖）降低用户离开率。",
      techniques: ["场景话术", "停留话术"],
    },
    {
      id: "brand",
      name: "品牌背书 + 引出产品（Interest）",
      description: "用品牌实力、资质、口碑建立信任，自然过渡到产品。对应 AIDA 的 Interest 阶段。",
      prompt_hint: "品牌加持化：用品牌实力背书（教育基因/科技实力/权威认证/用户口碑/行业地位）建立信任。用优势话术做竞品对比（对标产品vs我的产品），突出差异化。自然过渡引出今天推荐的产品。",
      techniques: ["优势话术", "品牌加持化"],
    },
    {
      id: "selling_points",
      name: "主卖点展示 + 竞品对比（Desire）",
      description: "逐一展示核心卖点，运用 FABE 原则，穿插竞品对比。对应 AIDA 的 Desire 阶段。",
      prompt_hint: "运用 FABE 原则展示 3-5 个核心卖点：Feature（特征）→ Advantage（优势）→ Benefit（利益）→ Evidence（证据）。痛点场景化：把用户问题讲具体（场景、情绪），再自然过渡到产品解决方案。卖点利他化：强调'解决什么问题'+'带来什么好处'。穿插评论互动引导（'想看的扣1'）。",
      techniques: ["FABE原则", "痛点场景化", "卖点利他化", "评论话术"],
    },
    {
      id: "first_close",
      name: "首次促单 + 售后保障（Action）",
      description: "第一次促单闭环，运用促单四大心理。对应 AIDA 的 Action 阶段。",
      prompt_hint: "运用促单四大心理：从众心理（'直播间好几万人在看，一直有人在下单'）、损失恐惧（'错过今天价格恢复原价'）、稀缺效应（'库存有限，拼手速'）、互惠效应（'今天额外加赠xxx'）。性价比话术：折算折扣价、折算单品价、折算功能价。比价话术：竞品vs自己、线上vs线下、日常vs活动。售后保障消除顾虑（7天无理由、包邮等）。",
      techniques: ["性价比话术", "比价话术", "促销成单话术", "从众心理", "损失恐惧", "稀缺效应", "互惠效应"],
    },
    {
      id: "emotion",
      name: "感情升华 + 应用场景",
      description: "从功能价值升华到情感价值，描绘使用场景，建立情感连接",
      prompt_hint: "用共情话术从功能价值升华到情感价值。描述产品带来的长期价值和情感收获，用生活化语言和故事打动用户。价值话术：呈现产品细节、品牌背书、价值升华。如'这不是花钱，是投资孩子的未来'。让用户产生画面感和向往，建立情感连接。",
      techniques: ["共情话术", "价值话术"],
    },
    {
      id: "second_close",
      name: "二次促单 + 收尾",
      description: "再次强调核心利益点，最后一波促单，引导关注和下一场预告",
      prompt_hint: "总结核心卖点和优惠，再次运用促单四大心理制造紧迫感。痛点放大+品牌保障+卖点重复的组合拳。引导立即下单，简洁有力地收尾。可加入下一场直播预告或关注引导。",
      techniques: ["促销成单话术", "停留话术"],
    },
  ],
};

export const STYLE_OPTIONS = [
  {
    id: "knowledge",
    name: "知识科普型",
    description: "侧重产品知识讲解和专业内容，用 FABE 原则建立信任，适合高客单价产品",
    icon: "BookOpen",
    prompt_extra: "语气专业但不枯燥，多用数据和对比，像一个懂行的朋友在分享。适合教育类、科技类产品。",
  },
  {
    id: "emotion",
    name: "情感共鸣型",
    description: "侧重场景描绘和情感连接，用故事和共情打动用户，适合亲子/生活类产品",
    icon: "Heart",
    prompt_extra: "多用生活化语言和故事，善于营造氛围和与观众建立情感连接。从文化和理念层面深入阐述产品价值。适合亲子类、生活方式类产品。",
  },
  {
    id: "promotion",
    name: "促销逼单型",
    description: "侧重价格优势和紧迫感，节奏快、利益点密集，适合大促/引流款",
    icon: "Zap",
    prompt_extra: "节奏紧凑、高能量，直奔主题。重点运用从众心理、损失恐惧、稀缺效应、互惠效应四大促单心理。多用性价比话术和比价话术。适合大促活动、引流款产品。",
  },
  {
    id: "brand",
    name: "品牌种草型",
    description: "侧重品牌故事和价值传递，建立长期信任，适合新品发布/品牌推广",
    icon: "Award",
    prompt_extra: "注重品牌故事、文化、产品理念分享，传递品牌价值。节奏相对舒缓，注重内容深度和观众沉浸体验。让用户从认识品牌→认知品牌→认同→认购。适合新品发布、品牌推广场景。",
  },
];

export const WORD_COUNT_OPTIONS = [
  { value: 800, label: "800字", description: "约3-5分钟", recommended_for: "引流款/低客单价/快节奏循环" },
  { value: 1500, label: "1500字", description: "约5-8分钟", recommended_for: "主推款/中客单价/标准闭环" },
  { value: 3000, label: "3000字", description: "约8-12分钟", recommended_for: "利润款/高客单价/深度讲解" },
];

export const LOOP_TIME_OPTIONS = [
  { value: 5, label: "5分钟", description: "快节奏循环，适合引流款" },
  { value: 8, label: "8分钟", description: "标准节奏（实战验证最优）" },
  { value: 10, label: "10分钟", description: "深度讲解，适合高客单价" },
];

export const CATEGORY_TEMPLATES = [
  {
    id: "children_edu",
    name: "儿童教育产品",
    icon: "GraduationCap",
    default_info: "产品类型：儿童教育/启蒙产品\n目标人群：3-12岁孩子的家长（宝妈为主）\n核心诉求：科学启蒙、能力培养、寓教于乐\n家长痛点：不知道启蒙阶段学什么、没时间陪孩子学习、怕买错浪费钱",
  },
  {
    id: "beauty",
    name: "美妆护肤",
    icon: "Sparkles",
    default_info: "产品类型：美妆/护肤产品\n目标人群：18-45岁女性\n核心诉求：肌肤改善、变美、性价比\n用户痛点：选品困难、怕踩坑、效果不确定",
  },
  {
    id: "food",
    name: "食品饮料",
    icon: "UtensilsCrossed",
    default_info: "产品类型：食品/饮料/零食\n目标人群：全年龄段\n核心诉求：好吃、健康、实惠\n用户痛点：食品安全、口味不确定、性价比",
  },
  {
    id: "digital",
    name: "3C数码",
    icon: "Smartphone",
    default_info: "产品类型：电子产品/数码配件\n目标人群：科技爱好者/年轻人\n核心诉求：性能、体验、性价比\n用户痛点：参数看不懂、怕买贵、售后担忧",
  },
  {
    id: "home",
    name: "家居生活",
    icon: "Home",
    default_info: "产品类型：家居/生活用品\n目标人群：家庭用户\n核心诉求：实用、品质、提升生活质量\n用户痛点：选品困难、质量参差不齐",
  },
  {
    id: "custom",
    name: "自定义",
    icon: "PenTool",
    default_info: "",
  },
];

export const TECHNIQUE_DESCRIPTIONS: Record<string, string> = {
  "场景话术": "通过描述具体生活场景，让用户产生代入感和共鸣",
  "停留话术": "通过预告福利、抽奖等方式降低用户离开率",
  "优势话术": "对标竞品做对比，突出自身产品的差异化优势",
  "品牌加持化": "用品牌实力背书+产品细节展示建立信任",
  "FABE原则": "Feature特征→Advantage优势→Benefit利益→Evidence证据",
  "痛点场景化": "场景描述痛点+场景放大后果，让用户感受到问题的紧迫性",
  "卖点利他化": "强调'解决什么问题'+'带来什么好处'，而非单纯列参数",
  "评论话术": "点对点评论、提问式互动、选择式互动，提升直播间活跃度",
  "性价比话术": "折算折扣价、折算单品价、折算节约价、折算功能价",
  "比价话术": "竞品vs自己、线上vs线下、日常vs活动、其他平台价格",
  "促销成单话术": "痛点放大+品牌保障+卖点重复的组合拳",
  "共情话术": "用情感鸡汤打动用户，从功能价值升华到情感价值",
  "价值话术": "呈现产品细节、赠品价值、品牌背书、价值升华",
  "从众心理": "'直播间好几万人在看，一直有人在下单'",
  "损失恐惧": "'错过今天价格恢复原价，距离结束没几个小时了'",
  "稀缺效应": "'库存有限，大家得拼手速了'",
  "互惠效应": "'今天额外加赠xxx，就是想让老用户体验品质'",
};
