<?php
/**
 *
 * License, TERMS and CONDITIONS
 *
 * This software is lisensed under the GNU LESSER GENERAL PUBLIC LICENSE (LGPL) version 3
 * Please read the license here : http://www.gnu.org/licenses/lgpl-3.0.txt
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * ATTRIBUTION REQUIRED
 * 4. All web pages generated by the use of this software, or at least
 * 	  the page that lists the recent questions (usually home page) must include
 *    a link to the http://www.lampcms.com and text of the link must indicate that
 *    the website's Questions/Answers functionality is powered by lampcms.com
 *    An example of acceptable link would be "Powered by <a href="http://www.lampcms.com">LampCMS</a>"
 *    The location of the link is not important, it can be in the footer of the page
 *    but it must not be hidden by style attibutes
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE FREEBSD PROJECT OR CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This product includes GeoLite data created by MaxMind,
 *  available from http://www.maxmind.com/
 *
 *
 * @author     Dmitri Snytkine <cms@lampcms.com>
 * @copyright  2005-2011 (or current year) ExamNotes.net inc.
 * @license    http://www.gnu.org/licenses/lgpl-3.0.txt GNU LESSER GENERAL PUBLIC LICENSE (LGPL) version 3
 * @link       http://www.lampcms.com   Lampcms.com project
 * @version    Release: @package_version@
 *
 *
 */

namespace Lampcms\Controllers;

use Lampcms\SocialCheckboxes;

use Lampcms\WebPage;
use Lampcms\RegBlockQuickReg;
use Lampcms\RegBlock;
use Lampcms\Template\Urhere;
use Lampcms\LoginForm;

/**
 * Class for displaying the "Ask question" Form
 *
 * @author Dmitri Snytkine
 *
 */
class Askform extends WebPage
{

	protected $permission = 'ask';

	/**
	 * Form object
	 *
	 * @var object of type \Lampcms\Forms\Askform
	 */
	protected $Form;

	protected $qtab = 'ask';

	protected $title;

	/**
	 *
	 * Layout 1 means no side columns - just one main area
	 * @var int
	 */
	protected $layoutID = 1;



	/**
	 * Main entry point
	 * for this class
	 * (non-PHPdoc)
	 * @see WebPage::main()
	 */
	protected function main(){
		$this->aPageVars['title'] = $this->title = $this->_('Create new topic');

		$this->addMetas()
		->configureEditor()
		->makeForm()
		->setMustLogin()
		->setForm()
		->makeTopTabs()
		->makeMemo()
		->makeHintBlocks();
	}


	/**
	 * Add extra meta tags to indicate
	 * that user has or does not have
	 * blogger and tumblr Oauth keys
	 *
	 * @return object $this
	 */
	protected function addMetas(){
		$this->addMetaTag('tm', (null !== $this->Registry->Viewer->getTumblrToken()));
		$this->addMetaTag('blgr', (null !== $this->Registry->Viewer->getBloggerToken()));
		$this->addMetaTag('linkedin', (null !== $this->Registry->Viewer->getLinkedInToken()));

		return $this;
	}


	/**
	 * Instantiate the $this->Form object
	 * and sets the value of 'social' var
	 *
	 * @return object $this
	 */
	protected function makeForm(){

		$this->Form = new \Lampcms\Forms\Askform($this->Registry);
		if(!$this->Form->isSubmitted()){
			$this->Form->setVar('socials', SocialCheckboxes::get($this->Registry));
		}

		return $this;
	}


	/**
	 * Set the value of $this->aPageVars['body']
	 * to the html of the form
	 *
	 * @return object $this
	 */
	protected function setForm(){

		/**
		 * In case of Ajax can just return the form now
		 */
		$this->aPageVars['body'] = $this->Form->getForm();

		return $this;
	}


	protected function makeTopTabs(){

		$tabs = Urhere::factory($this->Registry)->get('tplToptabs', $this->qtab);
		$this->aPageVars['topTabs'] = $tabs;

		return $this;
	}



	/**
	 * @todo translate this
	 *
	 * @return object $this
	 */
	protected function makeMemo(){
		$memo = '<strong>'.$this->_('Ask topic relevant to this community').'</strong>
		<ul>
		<li>Provide enough details</li>
		<li>Be clear and concise</li>
		<li>Provide tags relevant to your topic</li>
		</ul>';

		$this->aPageVars['qheader'] = '<div class="memo">'.$memo.'</div>';

		return $this;
	}


	protected function makeHintBlocks(){


		return $this;
	}

	/**
	 * Set classnames based on user logged in status
	 * not logged in user will get com_hand class
	 * which in turn will trigger popup on click
	 * on the form element
	 *
	 * @return object $this
	 */
	protected function setMustLogin(){

		if(!$this->isLoggedIn()){
			$this->Form->qbody = $this->_('Please login to post your topic');
			$this->Form->com_hand = ' com_hand';
			$this->Form->readonly = 'readonly="readonly"';
			$this->Form->disabled = ' disabled="disabled"';

			$oQuickReg = new RegBlockQuickReg($this->Registry);

			$socialButtons = LoginForm::makeSocialButtons($this->Registry);
			/**
			 * @todo Translate string
			 */
			if(!empty($socialButtons)){
				$this->Form->connectBlock = '<div class="com_connect"><h3>'.$this->_('Join with account you already have').'</h3>'.$socialButtons.'</div>';
			}
		}

		return $this;
	}

}
