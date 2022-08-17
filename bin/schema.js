const InitialSchemaTemplate = `
import { createSchema, generateModels } from 'r2om'

type Models = 'user' | 'profile' | 'post' | 'category' | 'role'

const schema = createSchema<Models>({
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
            profile: {
                type: 'relation',
                relation: 'oneToOne',
                releatedTo: 'profile',
                scalarIdentifier: 'userId'
            },
            posts: {
                type: 'relation',
                relation: 'oneToMany',
                releatedTo: 'post',
                scalarIdentifier: 'authorId'
            },
            roles:{
                type:'relation',
                relation:'manyToMany',
                releatedTo:'role',
                relateThrough:'role_user'
            }
        }
    },
    'profile': {
        label: 'Profile',
        isOneToOneModel: true,
        attributes: {
            username: {
                type: 'string'
            },
            email: {
                type: 'email'
            }
        }
    },
    'role': {
        label: 'Role',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            users: {
                type: 'relation',
                relation: 'manyToMany',
                releatedTo: 'user',
                relateThrough: 'role_user'
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
                releatedTo: 'post',
                relateThrough: 'category_post'
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
                relateThrough: 'category_post'
            }
        }
    }
})


generateModels(schema)
`


module.exports = InitialSchemaTemplate