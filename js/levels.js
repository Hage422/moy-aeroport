// levels.js — services, upgrades, levels and the game's numbers
const SERVICES = ['deboard', 'baggage', 'fuel', 'catering', 'board', 'takeoff'];        // fixed order = the order of the buttons
const SERVICE_NAMES = { deboard: 'Высадка пассажиров', baggage: 'Выгрузка багажа', fuel: 'Заправка', catering: 'Питание', board: 'Посадка пассажиров', takeoff: 'Взлёт' };

const UPGRADES = [
  { id: 'reg',    name: 'Электронная регистрация', price: 500,  icon: 'regist',   desc: 'Посадка пассажиров проходит быстрее.' },
  { id: 'bus',    name: 'Автобусное обслуживание', price: 1200, icon: 'bus',      desc: 'При высадке пассажиров нужный автобус выбирается сам.' },
  { id: 'fuel',   name: 'Топливная служба',        price: 1200, icon: 'fuel',     desc: 'Заправка самолётов проходит быстрее.' },
  { id: 'bagAB',  name: 'Багаж A и B',             price: 1000, icon: 'baggage',  desc: 'Выгрузка багажа в секторах A и B идёт быстрее.' },
  { id: 'bagCD',  name: 'Багаж C и D',             price: 1000, icon: 'baggage',  desc: 'Выгрузка багажа в секторах C и D идёт быстрее.' },
  { id: 'brgAB',  name: 'Рукава A и B',            price: 1000, icon: 'bridge',   desc: 'В секторах A и B тип самолёта для рукава выбирается сам.' },
  { id: 'brgCD',  name: 'Рукава C и D',            price: 1000, icon: 'bridge',   desc: 'В секторах C и D тип самолёта для рукава выбирается сам.' },
  { id: 'cater',  name: 'Кейтеринг',               price: 1500, icon: 'catering', desc: 'Тип самолёта для питания выбирается сам.' },
  { id: 'park',   name: 'Помощник парковки',       price: 1500, icon: 'parking',  desc: 'После посадки самолёт сам едет на ближайшую свободную стоянку.' },
  { id: 'ready',  name: 'Готовность ко взлёту',    price: 2000, icon: 'ready',    desc: 'Дополнительная индикация готовности самолёта к вылету.' },
  { id: 'beacon', name: 'Радиомаяк',               price: 2000, icon: 'beacon',   desc: 'Если полоса занята, откладывает следующий прилёт. Срабатывает сам, 5 раз за уровень.' },
];

// plan = planes to serve per size; first = seconds before the first landing; gap = seconds between landings (random in the range)
const LEVEL_DEFS = [
  { n: 1, name: 'Обучение',       plan: { S: 1, M: 0, L: 0 }, first: 4,   gap: [0, 0],   patience: 120, tut: true },
  { n: 2, name: 'Первый опыт',    plan: { S: 3, M: 0, L: 0 }, first: 4,   gap: [32, 42], patience: 100 },
  { n: 3, name: 'Второй тип',     plan: { S: 3, M: 3, L: 0 }, first: 4,   gap: [27, 37], patience: 92 },
  { n: 4, name: 'Дневная смена',  plan: { S: 3, M: 3, L: 0 }, first: 4,   gap: [22, 31], patience: 84 },
  { n: 5, name: 'Большие братья', plan: { S: 2, M: 4, L: 2 }, first: 4,   gap: [22, 31], patience: 84 },
  { n: 6, name: 'Зима скоро',     plan: { S: 3, M: 4, L: 3 }, first: 4,   gap: [20, 29], patience: 78 },
];
const PLAYABLE_LEVELS = 6;
const DIFF_PATIENCE = [1.35, 1, 0.75], DIFF_GAP = [1.3, 1, 0.8];           // easy / normal / hard
const BASE_REWARD = { S: 70, M: 100, L: 150 };
const SVC_TIME = 6, STEP_TIME_REMOTE = 12, FAST = 0.6;                       // seconds; passenger steps without a jet bridge take twice as long

const diffName = i => ['Легко', 'Нормально', 'Сложно'][i];
