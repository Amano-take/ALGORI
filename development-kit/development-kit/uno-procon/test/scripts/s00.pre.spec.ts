import { TestService } from '../../src/commons/test.service';
import { SequenceController } from '../../src/api/sequence/sequence.controller';
import { getLogger } from '../../src/libs/commons';

const sequenceController = new SequenceController();

before(async () => {
  try {
    await TestService.resetDb();
    await sequenceController.init();
  } catch (exception) {
    getLogger('test', '').error(`before exception: `, exception);
  }
});

after(async () => {
  try {
    await TestService.resetDb();
  } catch (exception) {
    getLogger('test', '').error(`after exception: `, exception);
  }
});
