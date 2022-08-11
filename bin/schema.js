const InitialSchemaTemplate = `
import { createSchema, generateModels } from 'r2om'

type Models = 'user' | 'profile' | 'post' | 'category'

const schema = createSchema<Models>({
    'user': {
        label: 'User',        
        attributes: {
            'firstname': {
                type: 'string',
                required: true
            },
            'lastname': {
                type: 'string'
            },
            'profile': {
                type: 'relation',
                relation: 'oneToOne',
                releatedTo: 'profile',
                scalarIdentifier: 'userId'
            },
            'posts': {
                type: 'relation',
                relation: 'oneToMany',
                releatedTo: 'post',
                scalarIdentifier: 'authorId'
            }
        }
    },
    'profile': {
        label: 'Profile',
        isOneToOneModel:true,
        attributes: {
            username: {
                type: 'string'
            },
            email: {
                type: 'string'
            }   
        }
    },
    'category': {
        label: 'Category',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            posts: {
                type: 'relation',
                relation: 'manyToMany',
                releatedTo: 'post'
            }
        }
    },
    'post': {
        label: 'Post',
        attributes: {
            title: {
                type: 'string',
                required: true
            },
            authorId: {
                type: 'relation',
                relation: 'belongsTo',
                releatedTo: 'user',
                isScalarField: true
            },
            categories: {
                type: 'relation',
                relation: 'manyToMany',
                releatedTo: 'category',
            }
        }
    }
})


generateModels(schema)
`


module.exports = InitialSchemaTemplate