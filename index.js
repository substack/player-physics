var THREE = require('three')
var inherits = require('inherits')
var stream = require('stream')

var PI_2 = Math.PI / 2

/**
 * based on PointerLockControls by mrdoob / http://mrdoob.com/
 * converted to a module + stream by @maxogden and @substack
 */

module.exports = function(camera, opts) {
  return new PlayerPhysics(camera, opts)
}

module.exports.PlayerPhysics = PlayerPhysics

function PlayerPhysics(camera, opts) {
  if (!(this instanceof PlayerPhysics)) return new PlayerPhysics(camera, opts)
  var self = this
  if (!opts) opts = {}
  
  this.readable = true
  this.writable = true
  this.enabled = false
  
  this.speed = {
    jump: opts.jump || 6,
    move: opts.move || 0.12,
    fall: opts.fall || 0.3
  }

  this.pitchObject = new THREE.Object3D()
  if (camera) this.pitchObject.add( camera )

  this.yawObject = new THREE.Object3D()
  this.yawObject.position.y = 10
  this.yawObject.add( this.pitchObject )

  this.moveForward = false
  this.moveBackward = false
  this.moveLeft = false
  this.moveRight = false

  this.isOnObject = false
  this.canJump = false
  this.gravityEnabled = true
  
  this.velocity = new THREE.Vector3()

  this.on('command', function(command, setting) {
    if (command === 'jump') {
      if ( self.canJump === true ) self.velocity.y += self.speed.jump
      self.canJump = false
      return
    }
    self[command] = setting
  })  
}

inherits(PlayerPhysics, stream.Stream)

PlayerPhysics.prototype.playerIsMoving = function() { 
  var v = this.velocity
  if (Math.abs(v.x) > 0.1 || Math.abs(v.y) > 0.1 || Math.abs(v.z) > 0.1) return true
  return false
}

PlayerPhysics.prototype.write = function(data) {
  if (this.enabled === false) return
  this.applyRotationDeltas(data)
}

PlayerPhysics.prototype.end = function() {
  this.emit('end')
}

PlayerPhysics.prototype.applyRotationDeltas = function(deltas) {
  this.yawObject.rotation.y -= deltas.dx * 0.002
  this.pitchObject.rotation.x -= deltas.dy * 0.002
  this.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.pitchObject.rotation.x))
}

PlayerPhysics.prototype.isOnObject = function ( booleanValue ) {
  this.isOnObject = booleanValue
  this.canJump = booleanValue
}

PlayerPhysics.prototype.tick = function (delta, cb) {
  if (this.enabled === false) return

  delta *= 0.1

  this.velocity.x += (-this.velocity.x) * 0.08 * delta
  this.velocity.z += (-this.velocity.z) * 0.08 * delta

  if (this.gravityEnabled) this.velocity.y -= this.speed.fall * delta

  if (this.moveForward) this.velocity.z -= this.speed.move * delta
  if (this.moveBackward) this.velocity.z += this.speed.move * delta

  if (this.moveLeft) this.velocity.x -= this.speed.move * delta
  if (this.moveRight) this.velocity.x += this.speed.move * delta

  if ( this.isOnObject === true ) this.velocity.y = Math.max(0, this.velocity.y)

  if (cb) cb(this)
  
  this.yawObject.translateX( this.velocity.x )
  this.yawObject.translateY( this.velocity.y )
  this.yawObject.translateZ( this.velocity.z )

  if (this.velocity.y === 0) this.canJump = true
}
