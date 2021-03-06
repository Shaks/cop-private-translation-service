
import * as tasks from "../task";
import JSONPath from "jsonpath";
import nock from 'nock';
import httpMocks from 'node-mocks-http';
import * as forms from '../forms'
import {expect, formTranslateController} from '../setUpTests'

describe('Form Data Resolve Controller', () => {

    describe('A call to data resolve controller for input type', () => {
        beforeEach(() => {
            nock('http://localhost:8000')
                .get('/form?name=testForm')
                .reply(200, forms.simpleForm);
            nock('http://localhost:9001')
                .post('/rpc/staffdetails', {
                    "argstaffemail" : "email"
                }).reply(200, []);
            nock('http://localhost:9001')
                .get('/shift?email=eq.email')
                .reply(200, []);
        });

        it('it should return an updated form schema for keycloakContext', async () => {
            const request = httpMocks.createRequest({
                method: 'GET',
                url: '/api/translation/form/testFrom',
                params: {
                    formName: "testForm"
                },
                kauth: {
                    grant: {
                        access_token: {
                            token: "test-token",
                            content: {
                                session_state: "session_id",
                                email: "email",
                                preferred_username: "test",
                                given_name: "testgivenname",
                                family_name: "testfamilyname"
                            }
                        }

                    }
                }
            });

            const response = await formTranslateController.getForm(request);
            const firstName = JSONPath.value(response, "$..components[?(@.key=='firstName')].defaultValue");
            const lastName = JSONPath.value(response, "$..components[?(@.key=='lastName')].defaultValue");
            const sessionId = JSONPath.value(response, "$..components[?(@.key=='sessionId')].defaultValue");

            expect(firstName).to.equal("testgivenname");
            expect(lastName).to.equal("testfamilyname");
            expect(sessionId).to.equal("session_id");
        });
    });

    describe('A call to data resolve controller for url type', () => {
        beforeEach(() => {
            nock('http://localhost:8000')
                .log(console.log)
                .get('/form?name=dataUrlForm')
                .reply(200, forms.dataUrlForm);
            nock('http://localhost:9001')
                .post('/rpc/staffdetails', {
                    "argstaffemail" : "email"
                }).reply(200, []);
            nock('http://localhost:9000')
                .get('/api/workflow/tasks/taskId')
                .reply(200, {});
            nock('http://localhost:9000')
                .get('/api/workflow/tasks/taskId/variables')
                .reply(200, tasks.taskVariables);
            nock('http://localhost:9000')
                .get('/api/workflow/process-instances/processInstanceId/variables')
                .reply(200, tasks.processVariables);
            nock('http://localhost:9001')
                .get('/shift?email=eq.email')
                .reply(200, []);

        });
        it('it should return an updated form schema for url', async () => {
            const request = httpMocks.createRequest({
                method: 'GET',
                url: '/api/translation/form/dataUrlForm',
                params: {
                    formName: "dataUrlForm"
                }, query: {
                    taskId: "taskId",
                    processInstanceId : 'processInstanceId'
                },
                kauth: {
                    grant: {
                        access_token: {
                            token: "test-token",
                            content: {
                                session_state: "session_id",
                                email: "email",
                                preferred_username: "test",
                                given_name: "testgivenname",
                                family_name: "testfamilyname"
                            }
                        }

                    }
                }
            });

            const response = await formTranslateController.getForm(request);
            const url = JSONPath.value(response, "$..components[?(@.key=='regionid')].data.url");
            const defaultValue = JSONPath.value(response, "$..components[?(@.key=='regionid')].defaultValue");
            expect(url).to.equal("http://localhost:9001/region");
            expect(defaultValue).to.equal("firstNameFromProcess");

            const lazyLoad =  JSONPath.value(response, "$..components[?(@.key=='regionid')].lazyLoad");
            expect(lazyLoad).to.equal(true);

            const widget = JSONPath.value(response, "$..components[?(@.key=='regionid')].widget");
            expect(widget).to.equal('html5');

        });
    });

});
