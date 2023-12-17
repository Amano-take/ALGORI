import Consts from '../helpers/consts';
import StaticValues from '../helpers/static-values';
import { RequestBuilder } from '../helpers/request-builder';

const request = new RequestBuilder('/admin/dealer');

describe('Dealer', () => {
  it(`s01-A-TC001: Admin create Dealer 1 - successfully`, (done) => {
    const body = {
      name: Consts.DEALER_1_NAME,
      totalTurn: Consts.TOTAL_TURN,
      whiteWild: Consts.WHITE_WILD.BIND_2,
    };
    request
      .post('')
      .send(body)
      .setValue([{ dealer_id_1: '_id' }])
      .expectStatus(200)
      .end(done);
  });

  it(`s01-A-TC002: Admin create more Dealer 1 - successfully`, (done) => {
    const body = {
      name: Consts.DEALER_1_NAME,
      totalTurn: Consts.TOTAL_TURN,
      whiteWild: Consts.WHITE_WILD.BIND_2,
    };
    request
      .post('')
      .send(body)
      .setValue([{ dealer_id_1: '_id' }])
      .expectStatus(200)
      .end(done);
  });

  it(`s01-A-TC003: Admin create more Dealer 1 - failed - Reason: Name Dealer is required`, (done) => {
    const body = { totalTurn: 1000 };
    request.post('').send(body).expectStatus(422).end(done);
  });

  it(`s01-A-TC004: Admin create more Dealer 1 - failed - Reason: Total Turn is required`, (done) => {
    const body = { name: Consts.DEALER_1_NAME };
    request.post('').send(body).expectStatus(422).end(done);
  });

  it(`s01-A-TC005: Admin list Dealer successfully`, (done) => {
    request.get('').expectStatus(200).end(done);
  });

  it(`s01-A-TC006: Admin get detail Dealer - successfully`, (done) => {
    request.get(`/${StaticValues.GLOBAL['dealer_id_1']}`).expectStatus(200).end(done);
  });

  it(`s01-A-TC007: Admin get detail Dealer - failed - Reason: Dealer not found`, (done) => {
    request.get(`/62296f45ab3e573aaaaaaaaa`).expectStatus(400).end(done);
  });

  it(`s01-A-TC008: Admin get detail Dealer - failed -Reason: Id invalid`, (done) => {
    request.get(`/aaaaaa`).expectStatus(422).end(done);
  });

  it(`s01-A-TC009: Admin delete Dealer - successfully`, (done) => {
    request.delete(`/${StaticValues.GLOBAL['dealer_id_1']}`).expectStatus(200).end(done);
  });

  it(`s01-A-TC010: Admin delete Dealer - failed - Reason: Dealer not found`, (done) => {
    request.get(`/62296f45ab3e573aaaaaaaaa`).expectStatus(400).end(done);
  });

  it(`s01-A-TC011: Admin delete Dealer - failed - Reason: Id invalid`, (done) => {
    request.get(`/aaaaaa`).expectStatus(422).end(done);
  });
});
