const { Op } = require('sequelize')
const { recipes } = require('../Sequelize/models')
const Joi = require('joi')
const { v4: uuidv4 } = require('uuid')

class recipesNewController {
  static async _search(req, res) {
    try {
      const { title } = req.query

      const schema = Joi.string()
      await schema.validateAsync(title)

      const search = await recipes.findAll({
        where: {
          title: {
            [Op.iLike]: `%${title}%`
          }
        }
      })

      if (search.length === 0) {
        throw { status: 404, message: 'No Recipe Found' }
      }

      res.status(200).json({
        status: 200,
        message: 'ok',
        data: {
          search
        }
      })
    } catch (error) {
      if (error.status === 404) {
        res.status(404).json({
          status: 404,
          message: error.message
        })
      } else {
        res.status(500).json({
          status: 500,
          message: 'internal application error'
        })
      }
    }
  }

  static async _add(req, res) {
    try {
      const schema = Joi.object({
        title: Joi.string().min(5).max(30).required(),
        description: Joi.string(),
        ingredients: Joi.array().items(Joi.string()),
        steps: Joi.array().items(Joi.string()),
        video: Joi.string().uri(),
        category: Joi.array().items(Joi.string()),
        image: Joi.string().uri()
      })

      await schema.validateAsync(req.body)

      const { user_uid } = req.locals.user
      const { title, description, ingredients, steps, video, category, image } =
        req.body
      const uuid = uuidv4()

      const ingredientsObj = {
        title,
        desc: description,
        ingridient: ingredients,
        steps
      }

      await recipes.create({
        title,
        status: 'public',
        video_url: video,
        recipes_uid: uuid,
        ingredients: ingredientsObj,
        sort_desc: description,
        rating: 4.7,
        category,
        created_by: user_uid,
        image
      })

      res.status(201).json({
        status: 201,
        message: 'recipe added'
      })
    } catch (error) {
      // console.log(error)
      if (
        error.message.includes('must be a valid uri') ||
        error.message.includes('must be a string') ||
        error.message.includes('length must be at least') ||
        error.message.includes('must be an array') ||
        error.message.includes('is not allowed') ||
        error.message.includes('length must be less than or equal to') ||
        error.message.includes('is required')
      ) {
        res.status(422).json({
          status: 422,
          message: String(error.message).replaceAll('"', "'")
        })
      } else {
        res.status(500).json({
          status: 500,
          message: 'internal application error'
        })
      }
    }
  }
}

module.exports = recipesNewController
