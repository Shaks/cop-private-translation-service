
class ProcessContext {
    constructor(variables) {
        if (variables && variables.data) {
            Object.keys(variables.data).forEach(key => {
                this[key] = variables.data[key].value
            });
        }
    }
}

export default ProcessContext;