let instance = null

export default class TouchHandler
{
    static SWIPE_THRESHOLD = 20 // Minumum difference in pixels at which a swipe gesture is detected
	static SWIPE_BORDER_THRESHOLD = 15 // Percent of the screen to be edges

	static MOVE_NONE = 0
	static MOVE_LEFT = 1
	static MOVE_RIGHT = 2
	static MOVE_UP = 3
	static MOVE_DOWN = 4
	
	static SWIPE_NONE = 0
    static SWIPE_LEFT = 1
    static SWIPE_RIGHT = 2
    static SWIPE_UP = 3
    static SWIPE_DOWN = 4
    static SWIPE_LEFT_FROM_SCREEN_EDGE = 5
    static SWIPE_RIGHT_FROM_SCREEN_EDGE = 6
    static SWIPE_UP_FROM_SCREEN_EDGE = 7
    static SWIPE_DOWN_FROM_SCREEN_EDGE = 8

	constructor()
	{
		this.swipeHandlers = []
		this.movingHandlers = []
		this.reset()
	}
	
	reset() {
		this.target = null
		this.currentDirection = null
		this.movingDirection = null
		this.movingExecutables = []
		this.start = {
			x: null,
			y: null
		}
		this.current = {
			x: null,
			y: null
		}
		this.end = {
			x: null,
			y: null
		}
	}
	
	getHandlerChildLevel(target, handler, level) {
		if (target?.tagName === 'HTML') {
			return false
		}
		if (!target.matches(handler)) {
			return this.getHandlerChildLevel(target.parentElement, handler, level+1)
		}
		return level
	}
	
	started() {
		this.currentDirection = null
		this.movingExecutables = this.getExecutables(this.movingHandlers)
	}
	
	ended() {
		if (this.direction(this.end.x, this.end.y)) {
			this.currentDirection = this.swipeDirection()
			for (let config of this.getExecutables(this.swipeHandlers)) {
				config.callback(this, this.currentDirection)
			}
		}
		this.reset()
	}
	
	moving() {
		this.movingDirection = this.direction(this.current.x, this.current.y)
		for (let config of this.movingExecutables) {
			config.callback(this, this.movingDirection)
		}
	}
	
	getExecutables(handlers) {
		let list = []
		let executable = null
		let lowest = null
		for (let config of handlers) {
			let level = this.getHandlerChildLevel(this.target, config.key, 0)
			if (config.priority) {
				list[level] = config
			} else if (level !== false) {
				if (lowest === null || lowest > level) {
					lowest = level
					executable = config
				}
			}
		}
		list.push(executable)
		return list.filter((n) => n)
	}
	
	direction(endX, endY) {
        let h = this.start.x - endX
        let v = this.start.y - endY
        // Horizontal difference dominates
        if (Math.abs(h) > Math.abs(v)) {
            if (h >= TouchHandler.SWIPE_THRESHOLD) {
                return TouchHandler.MOVE_LEFT
            } else if (h <= -TouchHandler.SWIPE_THRESHOLD) {
                return TouchHandler.MOVE_RIGHT
            }
        // Verical or no difference dominates
        } else {
            if (v >= TouchHandler.SWIPE_THRESHOLD) {
                return TouchHandler.MOVE_UP
            } else if (v <= -TouchHandler.SWIPE_THRESHOLD) {
                return TouchHandler.MOVE_DOWN
            }
        }
		// Not moving
		return TouchHandler.MOVE_NONE
	}
	// ------------------------------------------------------------------------------------------------------------
	// Moving specific methods
	// ------------------------------------------------------------------------------------------------------------
	isMovingLeft() {
		return this.movingDirection === TouchHandler.MOVE_LEFT
	}
	
	isMovingRight() {
		return this.movingDirection === TouchHandler.MOVE_RIGHT
	}
	// ------------------------------------------------------------------------------------------------------------
	// Swipe specific methods
	// ------------------------------------------------------------------------------------------------------------
	swipeDirection() {
		let direction = this.direction(this.end.x, this.end.y)
        let percentX = screen.availWidth * TouchHandler.SWIPE_BORDER_THRESHOLD / 100;
        let percentY = screen.availHeight * TouchHandler.SWIPE_BORDER_THRESHOLD / 100;
		if (direction === TouchHandler.MOVE_RIGHT) {
			// Ended at the edge?
			if (this.start.x <= percentX) {
				return TouchHandler.SWIPE_RIGHT_FROM_SCREEN_EDGE
			}
			return TouchHandler.SWIPE_RIGHT
		} else if (direction === TouchHandler.MOVE_LEFT) {
			if (this.start.x >= (screen.availWidth - percentX)) {
				return TouchHandler.SWIPE_LEFT_FROM_SCREEN_EDGE
			}
			return TouchHandler.SWIPE_LEFT
		} else if (direction === TouchHandler.MOVE_UP) {
			if (this.start.y >= (screen.availHeight - percentX)) {
				return TouchHandler.SWIPE_UP_FROM_SCREEN_EDGE
			}
			return TouchHandler.SWIPE_UP
		} else if (direction === TouchHandler.MOVE_DOWN) {
			if (this.start.y <= percentY) {
				return TouchHandler.SWIPE_DOWN_FROM_SCREEN_EDGE
			}
			return TouchHandler.SWIPE_DOWN
		}
		return TouchHandler.SWIPE_NONE
	}
	
	isSwipeLeft() {
		return this.currentDirection === TouchHandler.SWIPE_LEFT || this.currentDirection === TouchHandler.SWIPE_LEFT_FROM_SCREEN_EDGE
	}
	
	isSwipeRight() {
		return this.currentDirection === TouchHandler.SWIPE_RIGHT || this.currentDirection === TouchHandler.SWIPE_RIGHT_FROM_SCREEN_EDGE
	}
	
	isSwipeUp() {
		return this.currentDirection === TouchHandler.SWIPE_UP || this.currentDirection === TouchHandler.SWIPE_UP_FROM_SCREEN_EDGE
	}
	
	isSwipeDown() {
		return this.currentDirection === TouchHandler.SWIPE_DOWN || this.currentDirection === TouchHandler.SWIPE_DOWN_FROM_SCREEN_EDGE
	}
	
	isSwipeEdge() {
		return [
			TouchHandler.SWIPE_LEFT_FROM_SCREEN_EDGE,
			TouchHandler.SWIPE_RIGHT_FROM_SCREEN_EDGE,
			TouchHandler.SWIPE_UP_FROM_SCREEN_EDGE,
			TouchHandler.SWIPE_DOWN_FROM_SCREEN_EDGE
		].includes(this.currentDirection)
	}
	// ------------------------------------------------------------------------------------------------------------
	// Static methods to be used
	// ------------------------------------------------------------------------------------------------------------
	static setup()
    {
		if (instance === null) {
			instance = new TouchHandler()
			document.addEventListener('touchstart', (event) => {
				instance.target = event.target
				instance.startEvent = event
				instance.start.x = event.changedTouches[0].clientX
				instance.start.y = event.changedTouches[0].clientY
				instance.started()
			});
			document.addEventListener('touchmove', (event) => {
				instance.current.x = event.changedTouches[0].clientX
				instance.current.y = event.changedTouches[0].clientY
				instance.moving()
			})
			document.addEventListener('touchend', (event) => {
				instance.end.x = event.changedTouches[0].clientX
				instance.end.y = event.changedTouches[0].clientY
				instance.ended()
			})
		}
		return instance
    }
	
	static onSwipe(handler, callback, priority) {
		let key = handler.toString()
		let index = instance.swipeHandlers.findIndex((handler) => handler.key === key)
		let obj = {
			key: key,
			priority: priority || false,
			callback: callback
		}
		if (index === -1) {
			instance.swipeHandlers.push(obj)
		} else {
			instance.swipeHandlers[index] = obj
		}
	}
	
	static onMoving(handler, callback, priority) {
		let key = handler.toString()
		let index = instance.movingHandlers.findIndex((handler) => handler.key === key)
		let obj = {
			key: key,
			priority: priority || false,
			callback: callback
		}
		if (index === -1) {
			instance.movingHandlers.push(obj)
		} else {
			instance.movingHandlers[index] = obj
		}
	}
	
	static remove(handler) {
		let key = handler.toString()
		let swipeIndex = instance.swipeHandlers.findIndex((handler) => handler.key === key)
		if (swipeIndex > -1) {
			instance.swipeHandlers.splice(swipeIndex, 1)
		}
		let movingIndex = instance.movingHandlers.findIndex((handler) => handler.key === key)
		if (movingIndex > -1) {
			instance.swipeHandlers.splice(movingIndex, 1)
		}
	}
}
