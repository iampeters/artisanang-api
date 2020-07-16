/**
 * @swagger
 * components:
 *    schemas:
 *      User:
 *        type: array
 *        required:
 *          - name
 *          - email
 *        items:
 *         properties:
 *          name:
 *            type: string
 *          email:
 *            type: string
 *            format: email
 *            description: Email for the user, needs to be unique.
 *        example:
 *         name: ''
 *         email: ''
 */

/**
 * @swagger
 * components:
 *    schemas:
 *      Users:
 *        type: object
 *        required:
 *          - name
 *          - email
 *        items:
 *         properties:
 *          name:
 *            type: string
 *          email:
 *            type: string
 *            format: email
 *            description: Email for the user, needs to be unique.
 *          id:
 *            type: string
 *            format: uuid
 *            description: Email for the user, needs to be unique.
 *        example:
 *         name: ''
 *         email: ''
 *         id: ''
 */