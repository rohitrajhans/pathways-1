const Query = require('../../core/Query')
const Model = require('../../core/Model')

const createUpdatePathway = ({ id, name, steps, tags, description }) => {
    return new Query({
        statement: `
        MERGE (p:Pathway {id: $id})
        SET p.name = $name
        SET p.description = $description
        WITH p
        UNWIND $steps as step
        CALL apoc.do.when(
            step.isPathway,
            '
            MERGE (s:Step {id: step.id})
            SET s.name = step.name, s.time = step.time, s.index = step.index
            WITH s, p, step
            OPTIONAL MATCH (s)-[r1:HAS_CONTENT]->(:Content)
            OPTIONAL MATCH (s)-[r2:INCLUDES]->(:Pathway)
            DELETE r1, r2
            WITH s, p, step
            MATCH (pother:Pathway {id: step.typeId})
            CREATE (pother)<-[r:INCLUDES]-(s)
            MERGE (p)<-[:HAS_PARENT_PATHWAY]-(s)
            RETURN p
            ',
            '
            MERGE (s:Step {id: step.id})
            SET s.name = step.name, s.time = step.time, s.index = step.index, s.isPathway = step.isPathway
            WITH s, p, step
            OPTIONAL MATCH (s)-[r1:HAS_CONTENT]->(:Content)
            OPTIONAL MATCH (s)-[r2:INCLUDES]->(:Pathway)
            DELETE r1, r2
            WITH s, p, step
            MATCH (c:Content {id: step.typeId})
            CREATE (c)<-[:HAS_CONTENT]-(s)
            MERGE (p)<-[:HAS_PARENT_PATHWAY]-(s)
            RETURN p
            ',
            {
                step: step,
                p: p
            }
        )
        YIELD value
        UNWIND $tags as tag
        MERGE (t:Tag {name: tag})
        MERGE (p)-[r:HAS_TAG]->(t)
        WITH DISTINCT p
        RETURN p.id
        `,
        params: {
            id,
            name,
            steps,
            tags,
            description,
        },
    })
}

module.exports = createUpdatePathway
