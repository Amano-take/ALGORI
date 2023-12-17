import * as chai from 'chai';
import * as webdriver from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as BlueBird from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import JSONL from 'jsonl-parse-stringify';
import sanitize = require('sanitize-filename');

import Consts from '../helpers/consts';

import APP_CONFIG from '../../src/configs/app.config';
import { AppConst } from '../../src/commons/consts/app.const';

const dealerList = `http://localhost:${APP_CONFIG.ENV.APP.PORT}/${AppConst.API_PREFIX}/${AppConst.API_VERSION}/admin/web`;
const gameLog = `http://localhost:${APP_CONFIG.ENV.APP.PORT}/${AppConst.API_PREFIX}/${AppConst.API_VERSION}/admin/web/log`;
const logPath = './logs/';

// ディーラー新規追加
describe('Add dealers to management tools', function () {
  let driver: webdriver.WebDriver;
  before(function () {
    driver = new webdriver.Builder().forBrowser('chrome').build();
  });

  // ディーラー名 境界値(null) - 失敗
  it(`s04-A-TC001: Dealer name (null) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // ディーラー名 境界値(空白) - 失敗
  it(`s04-A-TC002: Dealer name (blank) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_NAME_BLANK);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // ディーラー名 境界値(最小) - 成功
  it(`s04-A-TC003: Dealer name (min) - successfully`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_NAME_MIN);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // ディーラー名 境界値(最長) - 成功
  it(`s04-A-TC004: Dealer name (max) - successfully`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_NAME_MAX);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // ディーラー名 境界値(最長) - 失敗
  it(`s04-A-TC005: Dealer name (over) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_NAME_OVER);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // ディーラー名 同名 - 成功
  it(`s04-A-TC006: Dealer name (same name) - successfully`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // 対戦数 境界値(null) - 失敗
  it(`s04-A-TC007: Number of matches (null) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 対戦数 境界値(空白) - 失敗
  it(`s04-A-TC008: Number of matches (blank) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_BLANK);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 対戦数 境界値(正) - 成功
  it(`s04-A-TC009: Number of matches (plus) - successfully`, async () => {
    await driver.get(dealerList);

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // 対戦数 境界値(負) - 失敗
  it(`s04-A-TC010: Number of matches (minus) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_MINUS);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 対戦数 境界値(ゼロ) - 失敗
  it(`s04-A-TC011: Number of matches (zero) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_ZERO);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 対戦数 境界値(小数) - 失敗
  it(`s04-A-TC012: Number of matches (decimal) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_DECIMAL);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 対戦数 境界値(最大値) - 成功
  it(`s04-A-TC013: Number of matches (max) - successfully`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_MAX);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // 対戦数 境界値(最大値) - 失敗
  it(`s04-A-TC014: Number of matches (over) - failed`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN_OVER);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 白いワイルド 選択(スキップバインド2) - 成功
  it(`s04-A-TC015: White wild selection (Skip bind 2) - successfully`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // 白いワイルド 選択(バインド2) - 成功
  it(`s04-A-TC016: White wild selection (Bind 2) - successfully`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  after(function () {
    driver && driver.quit();
  });
});

// デモプレイヤー追加/試合開始、ログ
describe('Add demo player and start dealer and logging to management tools', function () {
  let driver: webdriver.WebDriver;
  const downloadDir = path.join(__dirname, 'downloads');

  before(function () {
    // ダウンロードディレクトリを設定
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }
    // Chromeのオプションを設定
    const options = new chrome.Options();
    options.setUserPreferences({ 'download.default_directory': downloadDir });

    driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  // 1〜4回のデモプレイヤー追加
  it(`s04-B-TC001: Add demo player (1 - 4)`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const beforeText = await driver.findElement(webdriver.By.className('panel')).getText();

    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const afterText = await driver.findElement(webdriver.By.className('panel')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // リロード
  it(`s04-B-TC002: Reload`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    const beforeText = await driver.findElement(webdriver.By.tagName('Body')).getText();

    // デモプレイヤーを1つ追加
    await driver.findElement(webdriver.By.className('add-btn')).click();
    await BlueBird.delay(50 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    // リロード
    await driver.findElement(webdriver.By.className('reload')).click();

    const afterText = await driver.findElement(webdriver.By.tagName('Body')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // 試合開始
  it(`s04-B-TC003: Start dealer`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    const beforeText = await driver.findElement(webdriver.By.tagName('Body')).getText();

    // デモプレイヤーを4つ追加して試合開始
    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('game-list')), 5000);
    await driver.findElement(webdriver.By.className('start-btn')).click();
    await BlueBird.delay(500 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    const afterText = await driver.findElement(webdriver.By.tagName('Body')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  // ログのダウンロード
  it(`s04-B-TC004: Download a log`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_2_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    // デモプレイヤーを4つ追加して試合開始
    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();
    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('start-btn')), 5000);
    await driver.findElement(webdriver.By.className('start-btn')).click();
    await BlueBird.delay(500 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    await driver.findElement(webdriver.By.className('download-btn')).click();

    // ダウンロードされたファイルの存在を確認
    const game_name = sanitize(
      await driver.findElement(webdriver.By.className('dealer-id')).getText(),
      { replacement: '_' },
    ).replace(/\s/g, '_');
    const filePath = path.join(
      downloadDir,
      `${game_name}-${await driver
        .findElement(webdriver.By.className('dealer-name'))
        .getText()}.log`,
    );

    driver
      .wait(() => fs.existsSync(filePath), 5000)
      .then(() => chai.expect(fs.existsSync(filePath)).to.be.true)
      .catch(() => chai.expect.fail('File did not download within specified time'));
  });

  after(function () {
    driver && driver.quit();
  });
});

// ページング
describe('Paging', function () {
  let driver: webdriver.WebDriver;
  before(function () {
    driver = new webdriver.Builder().forBrowser('chrome').build();
  });

  // ディーラー一覧のページング
  it(`s04-C-TC001: Paging the dealer list page`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    for (let i = 0; i < 40; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.id('new-dealer-name')), 5000);
      await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
      await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
      await driver
        .findElement(webdriver.By.id('white-wild'))
        .sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
      await driver.findElement(webdriver.By.id('create-btn')).click();
    }

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.navigate().to(`${dealerList}?order=desc&page=2`);

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  // ゲームログのページング
  it(`s04-C-TC002: Paging the game log`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_3_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    // デモプレイヤーを4つ追加して試合開始
    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('start-btn')), 5000);
    await driver.findElement(webdriver.By.className('start-btn')).click();
    await BlueBird.delay(500 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className('dealer-id')).getText();

    await driver.get(`${gameLog}/${dealerId}?turn=1`);

    const beforeText = await driver.findElement(webdriver.By.tagName('Body')).getText();

    await driver.navigate().to(`${gameLog}/${dealerId}?turn=2`);

    const afterText = await driver.findElement(webdriver.By.tagName('Body')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  after(function () {
    driver && driver.quit();
  });
});

describe('List Display Contents', function () {
  let driver: webdriver.WebDriver;
  before(function () {
    driver = new webdriver.Builder().forBrowser('chrome').build();
  });

  it(`s04-D-TC004: Verify that the following information is the same as in the .log
  ID, status, number of games played, number of players, player name, player ID, points, wins`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_3_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    const gameDisplayContent = await driver.findElement(webdriver.By.className('panel')).getText();

    const dealerId = await driver.findElement(webdriver.By.className('dealer-id')).getText();
    await driver.get(`${gameLog}/${dealerId}?turn=1`);

    const logDisplayContent =
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[1]'))
        .getText()) +
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[2]'))
        .getText());

    chai.expect(gameDisplayContent).to.equal(logDisplayContent);
  });

  it(`s04-D-TC005: The following errors are displayed correctly
  NAME_DEALER_IS_REQUIRED (ディーラー名を入力してください)
  TOTAL_TURN_IS_REQUIRED (対戦数を入力してください)
  TOTAL_TURN_INVALID (対戦数は1以上の整数を入力してください)
  STATUS_DEALER_INVALID_CAN_NOT_START_DEALER (この試合は既に開始されています)
  DEALER_IS_CURRENTLY_IN_MATCH (現在試合中のディーラーと同一のため作成できません)
  FULL_PLAYER (この試合は既にプレイヤーの上限人数に到達しています)
  NOT_FOUND_FILE (ファイルが見つかりません)`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('errors')), 5000);
    const beforeText = await driver.findElement(webdriver.By.className('errors')).getText();

    const errorMessages = [
      'ディーラー名を入力してください',
      '対戦数を入力してください',
      '対戦数は1以上の整数を入力してください',
      'この試合は既に開始されています',
      '現在試合中のディーラーと同一のため作成できません',
      'この試合は既にプレイヤーの上限人数に到達しています',
      'ファイルが見つかりません',
    ];

    chai.expect(beforeText).to.include.oneOf(errorMessages);
  });

  after(function () {
    driver && driver.quit();
  });
});

// Add dealers and players with similar timing and modified skip binds
describe('Add New Dealer and Demo Player ', function () {
  let driver: webdriver.WebDriver;

  before(function () {
    const options = new chrome.Options();
    driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  it(`s04-E-TC001: Add a dealer with the same name at the same time timing - successfully`, async () => {
    await driver.get(dealerList);

    // new browser instance
    const options = new chrome.Options();
    const secondaryDriver = new webdriver.Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await secondaryDriver.get(dealerList);

    await Promise.all([await load(driver), await load(secondaryDriver)]);

    // close secondary browser instance
    secondaryDriver && secondaryDriver.quit();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  async function load(d: webdriver.WebDriver) {
    await d.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await d.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await d.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await d.findElement(webdriver.By.id('create-btn')).click();
  }

  it(`s04-E-TC002: Add 4 demo players at the same time - successfully`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const beforeText = await driver.findElement(webdriver.By.className('panel')).getText();

    // Open 3 additional browser instances
    const options = new chrome.Options();
    const drivers: any = [];

    for (let i = 0; i < 4; i++) {
      const driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build();

      drivers.push(driver);
    }

    // pass url to each browser instance
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      await driver.get(dealerList);
    }

    // Click add button simultaneously in each browser
    await Promise.all([
      await drivers[0].wait(
        webdriver.until.elementLocated(webdriver.By.className('add-btn')),
        5000,
      ),
      drivers[0].findElement(webdriver.By.className('add-btn')).click(),
      await driver.navigate().refresh(),
      await drivers[1].wait(
        webdriver.until.elementLocated(webdriver.By.className('add-btn')),
        5000,
      ),
      drivers[1].findElement(webdriver.By.className('add-btn')).click(),
      await driver.navigate().refresh(),
      await drivers[2].wait(
        webdriver.until.elementLocated(webdriver.By.className('add-btn')),
        5000,
      ),
      drivers[2].findElement(webdriver.By.className('add-btn')).click(),
      await driver.navigate().refresh(),
      await drivers[3].wait(
        webdriver.until.elementLocated(webdriver.By.className('add-btn')),
        5000,
      ),
      drivers[3].findElement(webdriver.By.className('add-btn')).click(),
      await driver.navigate().refresh(),
    ]);

    await driver.navigate().refresh();

    await Promise.all(drivers.map((driver: webdriver.WebDriver) => driver && driver.quit()));

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const afterText = await driver.findElement(webdriver.By.className('panel')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  it(`s04-E-TC003: Add a dealer with a white wild other than the two defaults (Except skip bind 2 and bind 2)`, async () => {
    await driver.get(dealerList);

    const beforeText = await driver.findElement(webdriver.By.id('game-list')).getText();

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys('no_bind');
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.id('game-list')), 5000);
    const afterText = await driver.findElement(webdriver.By.id('game-list')).getText();
    chai.expect(beforeText).to.not.equal(afterText);
  });

  it(`s04-E-TC004: Add a 5th player - failed`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_1_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const beforeText = await driver.findElement(webdriver.By.className('panel')).getText();

    for (let i = 0; i <= 4; i++) {
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.findElement(webdriver.By.className('add-btn')).click();
    await BlueBird.delay(50 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('panel')), 5000);
    const afterText = await driver.findElement(webdriver.By.className('panel')).getText();
    chai.expect(beforeText).to.equal(afterText);
  });

  after(function () {
    driver && driver.quit();
  });
});

// 検索
describe('Search', function () {
  let driver: webdriver.WebDriver;
  before(function () {
    driver = new webdriver.Builder().forBrowser('chrome').build();
  });

  // ゲームログの検索
  it(`s04-F-TC001: Search the game log`, async () => {
    await driver.get(dealerList);

    // ディーラー追加
    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_4_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    // デモプレイヤーを4つ追加して試合開始
    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('start-btn')), 5000);
    await driver.findElement(webdriver.By.className('start-btn')).click();
    await BlueBird.delay(500 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className('dealer-id')).getText();

    await driver.get(`${gameLog}/${dealerId}?turn=1`);

    const checkboxes = Object.values(Consts.SOCKET.EVENT);
    let error = false;

    // Test all combinations
    Object.keys(checkboxes).forEach(async function (i) {
      // 全てのチェックを外す
      Object.keys(checkboxes).forEach(async function (j) {
        if (await driver.findElement(webdriver.By.id(`event-${checkboxes[j]}`)).isSelected()) {
          await driver.findElement(webdriver.By.id(`event-${checkboxes[j]}`)).click();
        }
      });
      const beforeText = await driver
        .findElement(webdriver.By.className('search-result-condition'))
        .getText();

      // 1つだけチェックを入れる
      await driver.findElement(webdriver.By.id(`event-${checkboxes[i]}`)).click();
      await driver.findElement(webdriver.By.id('search-btn')).click();
      const afterText = await driver
        .findElement(webdriver.By.className('search-result-condition'))
        .getText();

      if (beforeText === afterText) {
        error = true;
      }
    });

    // 全てのチェックを外す
    Object.keys(checkboxes).forEach(async function (i) {
      if (await driver.findElement(webdriver.By.id(`event-${checkboxes[i]}`)).isSelected()) {
        await driver.findElement(webdriver.By.id(`event-${checkboxes[i]}`)).click();
      }
    });

    // 2のn乗のパターンを試す
    const numPatterns = Math.pow(2, checkboxes.length);

    for (let i = 0; i < numPatterns; i++) {
      const beforeText = await driver
        .findElement(webdriver.By.className('search-result-condition'))
        .getText();
      for (let j = 0; j < checkboxes.length; j++) {
        const checkbox = driver.findElement(webdriver.By.id(`event-${checkboxes[j]}`));
        const isSelected = await checkbox.isSelected();
        // もしパターンと現在の状態が異なれば、クリックして状態を変更
        if (((i & (1 << j)) !== 0) !== isSelected) {
          await checkbox.click();
        }
      }
      // 検索
      await driver.findElement(webdriver.By.id('search-btn')).click();
      const afterText = await driver
        .findElement(webdriver.By.className('search-result-condition'))
        .getText();

      if (beforeText === afterText) {
        error = true;
      }
    }

    chai.expect(error).to.be.false;
  });

  after(function () {
    driver && driver.quit();
  });
});

// 試合ログ
describe('Game log', function () {
  let driver: webdriver.WebDriver;

  before(function () {
    driver = new webdriver.Builder().forBrowser("chrome").build();
  });

  it(`s04-D-TC001: View log`, async () => {
    await driver.get(dealerList);
    
    //const dealerName = Consts.DEALER_1_NAME;
    const dealerName = "Dealer " + Date.now();

    // ディーラー追加
    await driver.findElement(webdriver.By.id("new-dealer-name")).sendKeys(dealerName);
    await driver.findElement(webdriver.By.id("total-turn")).sendKeys(Consts.TOTAL_TURN_LOG_TEST);
    await driver.findElement(webdriver.By.id("white-wild")).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id("create-btn")).click();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className("dealer-id")).getText();

    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className("add-btn")).click();
    }

    await driver.navigate().refresh();

    await driver.findElement(webdriver.By.className("start-btn")).click();
    await BlueBird.delay(300 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    const filePath = logPath + sanitize(dealerName, { replacement: '_' }).replace(/\s/g, '_') + "-" + dealerId + ".log";
    const log: any = JSONL.parse(fs.readFileSync(filePath, "utf8"));
    const finishGameLog = log[log.length - 5];

    // 試合終了状態
    if (finishGameLog.dealer_code == dealerId && finishGameLog.event == "finish-game") {

      await driver.get(gameLog + "/" + dealerId);
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      
      // 対戦数、プレイヤー数、プレイヤーID、ポイントがログ通りか
      const corrects: any = {
        trun: finishGameLog.turn + ' / ' + finishGameLog.turn,  // 対戦数 
        players: Object.keys(finishGameLog.contents.score),  // プレイヤーID
        scores: Object.values(finishGameLog.contents.score),  // ポイント
      };

      console.log(corrects);

      const trunText = await driver.findElement(webdriver.By.className("trun")).getText();
      const playersText = await driver.findElement(webdriver.By.className("players")).getText();
      const scores = await driver.findElement(webdriver.By.className("scores")).getText();

      console.log(trunText, playersText, scores);

      chai.expect(trunText).to.equal(corrects.trun);
      chai.expect(playersText).to.equal(corrects.players);
      chai.expect(scores).to.equal(corrects.scores);
    }
  });

  it(`s04-D-TC002: Point`, async () => {
    await driver.get(dealerList);

    //const dealerName = Consts.DEALER_1_NAME;
    const dealerName = "Dealer " + Date.now();

    // ディーラー追加
    await driver.findElement(webdriver.By.id("new-dealer-name")).sendKeys(dealerName);
    await driver.findElement(webdriver.By.id("total-turn")).sendKeys(Consts.TOTAL_TURN_LOG_TEST);
    await driver.findElement(webdriver.By.id("white-wild")).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id("create-btn")).click();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className("dealer-id")).getText();

    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className("add-btn")).click();
    }

    await driver.navigate().refresh();

    await driver.findElement(webdriver.By.className("start-btn")).click();
    await BlueBird.delay(300 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    const filePath = logPath + sanitize(dealerName, { replacement: '_' }).replace(/\s/g, '_') + "-" + dealerId + ".log";
    const log: any = JSONL.parse(fs.readFileSync(filePath, "utf8"));
    const finishGameLog = log[log.length - 5];

    // 試合終了状態
    if (finishGameLog.dealer_code == dealerId && finishGameLog.event == "finish-game") {

      await driver.get(gameLog + "/" + dealerId);
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      
      // 得点
      const corrects: any = {
        score: finishGameLog.contents.score,  // 得点 
        total_score: finishGameLog.contents.total_score,  // 累計得点
      };

      console.log(corrects);

      const scoreText = await driver.findElement(webdriver.By.className("score")).getText();
      const totalScoreText = await driver.findElement(webdriver.By.className("score-total")).getText();

      console.log(scoreText, totalScoreText);

      chai.expect(scoreText).to.equal(corrects.score);
      chai.expect(totalScoreText).to.equal(corrects.total_score);
    }
  });

  it(`s04-D-TC003: View log (turn)`, async () => {
    await driver.get(dealerList);

    
    //const dealerName = Consts.DEALER_1_NAME;
    const dealerName = "Dealer " + Date.now();

    // ディーラー追加
    await driver.findElement(webdriver.By.id("new-dealer-name")).sendKeys(dealerName);
    await driver.findElement(webdriver.By.id("total-turn")).sendKeys(Consts.TOTAL_TURN_LOG_TEST);
    await driver.findElement(webdriver.By.id("white-wild")).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id("create-btn")).click();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className("dealer-id")).getText();

    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className("add-btn")).click();
    }

    await driver.navigate().refresh();

    await driver.findElement(webdriver.By.className("start-btn")).click();
    await BlueBird.delay(300 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    const filePath = logPath + sanitize(dealerName, { replacement: '_' }).replace(/\s/g, '_') + "-" + dealerId + ".log";
    const log: any = JSONL.parse(fs.readFileSync(filePath, "utf8"));
    const firstGameLog = log[4];

    if (firstGameLog.dealer_code == dealerId && firstGameLog.event == "first-player") {

      await driver.get(gameLog + "/" + dealerId);
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      
      // ターン数、イベント、盤面がログ通りか
      const corrects: any = {
        trun: firstGameLog.turn,  // ターン数
        event: firstGameLog.event,  // イベント
        reveal: firstGameLog.contents.first_card,  // 盤面
      };

      const trunPlayText = await driver.findElement(webdriver.By.className("trun_play")).getText();
      const activityText = await driver.findElement(webdriver.By.className("activity")).getText();
      const reveal = await driver.findElement(webdriver.By.className("reveal")).getText();

      chai.expect(trunPlayText).to.equal(corrects.trun);
      chai.expect(activityText).to.equal(corrects.event);
      chai.expect(reveal).to.equal(corrects.reveal);
    }
  });

  it(`s04-D-TC006: View log (search)`, async () => {
    await driver.get(dealerList);

    
    //const dealerName = Consts.DEALER_1_NAME;
    const dealerName = "Dealer " + Date.now();

    // ディーラー追加
    await driver.findElement(webdriver.By.id("new-dealer-name")).sendKeys(dealerName);
    await driver.findElement(webdriver.By.id("total-turn")).sendKeys(Consts.TOTAL_TURN_LOG_TEST);
    await driver.findElement(webdriver.By.id("white-wild")).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id("create-btn")).click();

    // 要素取得してディーラーIDを判定
    const dealerId = await driver.findElement(webdriver.By.className("dealer-id")).getText();

    for (let i = 0; i < 4; i++) {
      await driver.findElement(webdriver.By.className("add-btn")).click();
    }

    await driver.navigate().refresh();

    await driver.findElement(webdriver.By.className("start-btn")).click();
    await BlueBird.delay(300 * Consts.TIME_DELAY);
    await driver.navigate().refresh();

    const filePath = logPath + sanitize(dealerName, { replacement: '_' }).replace(/\s/g, '_') + "-" + dealerId + ".log";
    const log: any = JSONL.parse(fs.readFileSync(filePath, "utf8"));
    const firstGameLog = log[4];

    if (firstGameLog.dealer_code == dealerId && firstGameLog.event == "first-player") {

      await driver.get(gameLog + "/" + dealerId);
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      
      // 検索内容の反映
      const searchResultText = await driver.findElement(webdriver.By.className("search-result-condition")).getText();

      chai.expect(searchResultText).to.equal("対戦開始,色の変更,手札をシャッフル,カードを出す,カードを引く,引いたカードを出す,UNO宣言漏れ指摘,チャレンジ,対戦終了");
    }
  });

  after(function () {
    driver && driver.quit();
  });
});

describe('Player Results', function () {
  let driver: webdriver.WebDriver;

  before(function () {
    driver = new webdriver.Builder().forBrowser('chrome').build();
  });

  it(`s04-H-TC001: Verify that the following information is the same as in the .log
  ID, player name, total score, date and time created, date and time updated`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_3_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    const gameDisplayContent = await driver.findElement(webdriver.By.className('panel')).getText();

    const dealerId = await driver.findElement(webdriver.By.className('dealer-id')).getText();
    await driver.get(`${gameLog}/${dealerId}?turn=1`);

    const logDisplayContent =
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[1]'))
        .getText()) +
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[2]'))
        .getText());

    chai.expect(gameDisplayContent).to.equal(logDisplayContent);
  });

  it(`s04-H-TC002: Verify that the following information is the same as in the .log
  Dealer ID, number of games played, and total score for each dealer`, async () => {
    await driver.get(dealerList);

    await driver.findElement(webdriver.By.id('new-dealer-name')).sendKeys(Consts.DEALER_3_NAME);
    await driver.findElement(webdriver.By.id('total-turn')).sendKeys(Consts.TOTAL_TURN);
    await driver.findElement(webdriver.By.id('white-wild')).sendKeys(Consts.WHITE_WILD.SKIP_BIND_2);
    await driver.findElement(webdriver.By.id('create-btn')).click();

    for (let i = 0; i < 4; i++) {
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('add-btn')), 5000);
      await driver.findElement(webdriver.By.className('add-btn')).click();
      await BlueBird.delay(50 * Consts.TIME_DELAY);
      await driver.navigate().refresh();
    }

    await driver.navigate().refresh();

    const gameDisplayContent = await driver.findElement(webdriver.By.className('panel')).getText();

    const dealerId = await driver.findElement(webdriver.By.className('dealer-id')).getText();
    await driver.get(`${gameLog}/${dealerId}?turn=1`);

    const logDisplayContent =
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[1]'))
        .getText()) +
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[3]'))
        .getText()) +
      (await driver
        .findElement(webdriver.By.xpath('/html/body/div[1]/div/div[1]/div[2]'))
        .getText());

    chai.expect(gameDisplayContent).to.equal(logDisplayContent);
  });

  after(function () {
    driver && driver.quit();
  });
});