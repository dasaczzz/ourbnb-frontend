import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchCreateReview, fetchDeleteReviewById, fetchReviewsByPostId } from '../../lib/api'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../primitives/Button'
import { buildReviewGraph } from '../../lib/reviewGraph'
import ReviewGraphVisualization from './ReviewGraphVisualization'

interface Review {
  id: string;
  comment: string;
  date_review: string;
  qualification: number;
  user_id: {
    $oid: string;
  };
  post_id: string;
  user: {
    name: string;
    profilepic: string;
  };
}

export const ReviewCard = () => {
  const {post_id} = useParams()
  const state = useSelector((state:any) => state.user)
  const [reviews, setReviews] = useState<Review[]>([])
  const [refresh, setRefresh] = useState(0)
  const [ comment, setComment] = useState('')
  const [qualification, setQualification] = useState(0)
  const [reviewGraph, setReviewGraph] = useState<any>(null)

  const handleDeleteReview = async(id: string) => {
    const response = await fetchDeleteReviewById(id)
    setRefresh(prev => prev + 1)
    if (!response) {
      toast.error('No se pudo eliminar la reseña.')
      return
    }
    toast.success('Has eliminado la reseña.')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!comment) {
        toast.error('Debes poner un comentario')
    return
    }
    if (!qualification) {
      toast.error('Debes calificar')
    return
    }

    const date_review = new Date().toISOString()
    const user_id = state.id

    const reviewData = {
      comment,
      date_review,
      qualification,
      user_id,
      post_id,
    }

    try {
        await fetchCreateReview(reviewData)
        toast.success('Review creada con éxito!')
        // Add a short delay before refreshing to ensure backend data consistency
        setTimeout(() => {
          setRefresh(prev => prev + 1)
        }, 500)
    } catch (error: any) {
        if (error.response?.data?.details) {
            toast.error(error.response.data.details)
        } else if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else {
            toast.error('Error desconocido al crear la reseña')
        }
    }
  }

    useEffect(() => {
    const getReviews = async (post_id: string) => {
      try {
        const reviews = await fetchReviewsByPostId(post_id)
        console.log('Review date structure:', reviews[0]?.date_review) // Debug log
        setReviews(reviews)
        // Build graph data structure from reviews
        const graph = buildReviewGraph(reviews, post_id)
        setReviewGraph(graph)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }
    if (post_id) {
      getReviews(post_id)
    }
  }, [post_id, refresh])

  return (
    <div className="flex-[0.6] w-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold mt-4">Reseñas</h2>

        {/* The graph data structure is built and stored in reviewGraph state */}
        {/* You can use reviewGraph for further processing or visualization */}

        {/* pa las reviews */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl">
          {reviews.map((review, index) => (
            <div key={`${review.id}-${index}`} className=" border border-gray-300 bg-white rounded-2xl shadow-md p-3 max-w-xs flex flex-row gap-4">
              <div className="flex flex-col w-full">
                <Link to={`/HostProfile/${review.user_id}`} className="flex items-center gap-2 mb-2 rounded-xl transition duration-200 hover:bg-gray-100 w-full">
                  <img src={review.user.profilepic} alt={"nombre"} className="w-10 h-10 rounded-full object-cover"/>
                  <div>
                    <h3 className="font-semibold">{review.user.name}</h3>
                    <p className="text-sm text-gray-500 w-full">
                      {new Date(review.date_review).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < review.qualification ? 'text-[#2c6d67]' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                {state.id == review.user_id &&
                  <Button 
                    onClick={() => handleDeleteReview(review.id)} 
                    intent='cancel'
                    >Eliminar Reseña
                  </Button>
                }
              </div>
            </div>
          ))}
        </div>
        <div className="relative z-0 pointer-events-none">
          <ReviewGraphVisualization graph={reviewGraph} />
        </div>

        {/* si no hay reviews */}
        {!reviews.length && (
          <div className='flex items-center'>
            <p className="text-sm text-gray-500 mr-1.5">La publicación no tiene reseñas. ¡Haz la primera!</p>
          </div>
        )}

        {/* crear reviews */}
        <div className="gap-2 w-full">
          <form onSubmit={handleSubmit} className=' gap-3 border border-gray-300 shadow-md rounded-xl p-3 w-100'>
            <h3 className='text-xl font-bold'> Crear reseña</h3>

            {state.id?
              <div>
                <div className=" items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setQualification(index + 1)}
                      className={`text-2xl transition-colors ${
                        index < qualification ? 'text-[#2c6d67]' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  className='mt-2 text-sm text-gray-500 border border-gray-300 rounded-xl p-2 w-93'
                  placeholder='Comparte tu experiencia con este espacio.'
                  value={comment} onChange={e => setComment(e.target.value)}/>
                <div>
                  <button type="submit" className='cursor-pointer text-white bg-[#2c6d67] rounded-xl p-2 w-full t-8 transition duration-200 hover:bg-[#2c6d67]/80'>
                    Publicar
                  </button>
                </div>
                </div>
              : 
                <div>
                  <h3 className="text-[#2c6d67] text-xs font-bold flex items-center gap-1 mb-2">Deberás iniciar sesión para publicar una reseña</h3>
                  <Link to={"/login"}>
                    <Button intent="primary">Iniciar Sesión</Button>
                  </Link>
                </div>
              }
          </form>
        </div>
      </div>
    </div>
  )
}
