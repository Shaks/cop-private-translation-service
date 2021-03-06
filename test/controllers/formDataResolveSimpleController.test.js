import JSONPath from "jsonpath";
import nock from 'nock';
import httpMocks from 'node-mocks-http';
import * as forms from '../forms'
import {expect, formTranslateController} from '../setUpTests'

describe('Form Data Resolve Controller', () => {

    describe('A call to data resolve controller with simple form', () => {
        beforeEach(() => {
            nock('http://localhost:8000')
                .get('/form?name=noContextData')
                .reply(200, forms.noContextData);
            nock('http://localhost:9001')
                .post('/rpc/staffdetails', {
                    "argstaffemail" : "email"
                })
                .reply(200, []);
            nock('http://localhost:9001')
                .get('/shift?email=eq.email')
                .reply(200, []);
        });
        it('it should return form without any data resolution', async () => {
            const request = httpMocks.createRequest({
                method: 'GET',
                url: '/api/translation/form',
                params: {
                    formName: "noContextData"
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

            expect(firstName).to.equal("Test");
            expect(lastName).to.equal("Test");

        });
    });

});
