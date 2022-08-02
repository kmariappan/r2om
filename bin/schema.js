const InitialSchemaTemplate = `
const { createSchema, generateModels } = require('r2om')

const schema = createSchema({
    'user': {
        label: 'User',
        attributes: {
            firstname: {
                type: 'string',
                required: true
            },
            lastname: {
                type: 'string'
            },
            email: {
                type: 'string',
                required: true,
                unique: true
            },
            age: {
                type: 'number'
            },
            addresses: {
                type: 'relation',
                relation: 'oneToMany',
                releatedTo: 'address'

            }
        }
    },
    'address': {
        label: 'Address',
        attributes: {
            city: {
                type: 'string',
                required: true
            },
            postalCode: {
                type: 'number',
                required: true,
                unique: true
            }
        }
    }
})

generateModels(schema)
`


module.exports = InitialSchemaTemplate