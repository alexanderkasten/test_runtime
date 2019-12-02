'use strict';

const should = require('should');
const TestFixtureProvider = require('../../dist/commonjs/test_setup').TestFixtureProvider;

describe('Service Task - ', () => {

  let testFixtureProvider;

  const processModelId = 'service_task_test';
  const processModelExternalTaskId = 'service_task_external_test';
  const startEventId = 'StartEvent_1';
  const useAutoGeneratedCorrelationId = undefined;

  before(async () => {
    testFixtureProvider = new TestFixtureProvider();
    await testFixtureProvider.initializeAndStart();

    await testFixtureProvider.importProcessFiles([processModelId, processModelExternalTaskId]);
  });

  after(async () => {
    await testFixtureProvider.tearDown();
  });

  it('should sucessfully perform a series of ServiceTasks that use a method invocation', async () => {

    const initialToken = {
      test_type: 'method_invocation',
    };

    const simpleObject = {
      prop1: 1337,
      prop2: 'Hello World',
    };

    const result = await testFixtureProvider.executeProcess(processModelId, startEventId, useAutoGeneratedCorrelationId, initialToken);

    should(result).have.property('currentToken');
    should(result.currentToken).be.eql(simpleObject);
  });

  it('should successfully skip a ServiceTask that has no invocation specified', async () => {

    const initialToken = {
      test_type: 'empty_invocation',
    };

    const expectedResult = /empty.*?successfully run/i;

    const result = await testFixtureProvider.executeProcess(processModelId, startEventId, useAutoGeneratedCorrelationId, initialToken);

    should(result).have.property('currentToken');
    should(result.currentToken).be.match(expectedResult);
  });

  it('should successfully skip a ServiceTask that has unsupported extension properties attached to it', async () => {

    const initialToken = {
      test_type: 'unsupported_invocation',
    };

    const result = await testFixtureProvider.executeProcess(processModelId, startEventId, useAutoGeneratedCorrelationId, initialToken);

    const expectedResult = /unsupported.*?successfully run/i;

    should(result).have.property('currentToken');
    should(result.currentToken).be.match(expectedResult);
  });

  it('should treat an internal ServiceTask with an external invocation the same as a ServiceTask with unsupported extension properties', async () => {

    const initialToken = {
      test_type: 'misconfigured_internal',
    };

    const result = await testFixtureProvider.executeProcess(processModelExternalTaskId, startEventId, useAutoGeneratedCorrelationId, initialToken);

    const expectedResult = /successfully executed/i;

    should(result).have.property('currentToken');
    should(result.currentToken).be.match(expectedResult);
  });

  it('should sucessfully execute an external ServiceTask', async () => {

    const initialToken = {
      test_type: 'normal',
    };

    const result = await testFixtureProvider.executeProcess(processModelExternalTaskId, startEventId, useAutoGeneratedCorrelationId, initialToken);


    should(result).have.property('currentToken');
    should(result.currentToken).have.property('testResults');
  });

  it('should sucessfully execute an external ServiceTask that uses token expressions as a topic', async () => {

    const initialToken = {
      topic: 'service_task_external_test_topic',
      test_type: 'topic_from_token',
    };

    const result = await testFixtureProvider.executeProcess(processModelExternalTaskId, startEventId, useAutoGeneratedCorrelationId, initialToken);

    should(result).have.property('currentToken');
    should(result.currentToken).have.property('testResults');
  });

  it('should fail to execute an external ServiceTask, if the topic is misconfigured', async () => {

    const initialToken = {
      test_type: 'invalid_token_topic',
    };

    try {
      await testFixtureProvider.executeProcess(processModelExternalTaskId, startEventId, useAutoGeneratedCorrelationId, initialToken);
      should.fail('error', undefined, 'This should have failed, because the configured topic is invalid!');
    } catch (error) {
      const expectedErrorCode = 500;
      const expectedErrorMessage = /topic.*?is invalid/i;
      should(error.message).be.match(expectedErrorMessage);
      should(error.code).be.equal(expectedErrorCode);
    }
  });

  it('should fail to execute an external ServiceTask, if the attached payload is misconfigured', async () => {

    const initialToken = {
      test_type: 'invalid_token_payload',
    };

    try {
      await testFixtureProvider.executeProcess(processModelExternalTaskId, startEventId, useAutoGeneratedCorrelationId, initialToken);
      should.fail('error', undefined, 'This should have failed, because the configured payload is invalid!');
    } catch (error) {
      const expectedErrorCode = 500;
      const expectedErrorMessage = /payload configuration.*?is invalid/i;
      should(error.message).be.match(expectedErrorMessage);
      should(error.code).be.equal(expectedErrorCode);
    }
  });

  it('should fail to execute a ServiceTask, whose invocation exits with an Error', async () => {

    const initialToken = {
      test_type: 'throw_exception',
    };

    const expectedErrorMessage = /failed/i;

    try {
      await testFixtureProvider.executeProcess(processModelId, startEventId, useAutoGeneratedCorrelationId, initialToken);
      should.fail('error', undefined, 'This should have failed, because the target invocation is supposed to throw an error!');
    } catch (error) {
      should(error.message).be.match(expectedErrorMessage);
    }
  });
});
