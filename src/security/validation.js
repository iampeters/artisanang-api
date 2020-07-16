// import Joi from 'joi';
// import joiObjectId from 'joi-objectid';
// import { textChangeRangeIsUnchanged } from 'typescript';
// Joi.objectId = joiObjectId(Joi);

// export function validateUser(user) {
// 	const schema = {
// 		name: Joi.string()
// 			.min(2)
// 			.max(255)
// 			.required(),
// 		email: Joi.string()
// 			.min(5)
// 			.max(255)
// 			.email({
// 				minDomainAtoms: 2
// 			})
// 			.required(),
// 	};

// 	return Joi.validate(user, schema);
// }